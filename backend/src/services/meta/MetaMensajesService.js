const Mensajes = require('../../repositories/MetaMensajesRepository');
const CanalesService = require('../CanalesService');
const Cliente = require('./MetaCliente');
const Comprobantes = require('./MetaComprobantes');
const { dividirTexto } = require('./MetaProtocolo');

function iniciarProcesador(config) {
  let trabajando = false;
  let detenido = false;
  let trabajoActual = Promise.resolve();
  async function paso() {
    if (trabajando || detenido) return;
    trabajando = true;
    let mensaje;
    try {
      mensaje = await Mensajes.reclamar();
      if (!mensaje) return;
      await CanalesService.resolverCanalActivo(mensaje.canalId);
      if (mensaje.estado === 'PROCESANDO') {
        let respuesta;
        if (mensaje.texto) respuesta = await Cliente.consultarChat(config, mensaje);
        else if (mensaje.medio?.id) respuesta = await Comprobantes.recibir(config, mensaje);
        else respuesta = 'Por ahora puedo recibir texto y comprobantes en imagen JPG, PNG o PDF. Escríbeme tu consulta o envía el archivo en uno de esos formatos.';
        await Mensajes.actualizar(mensaje.id, { estado: 'RESPUESTA_LISTA', respuesta,
          leaseHasta: null, ultimoError: null });
      } else {
        const partes = dividirTexto(mensaje.respuesta);
        let enviados = mensaje.partesEnviadas;
        const ids = [...(mensaje.idsSalida || [])];
        for (; enviados < partes.length; enviados++) {
          ids.push(await Cliente.enviarTexto(config, mensaje.numeroId, mensaje.remitente, partes[enviados]));
          await Mensajes.actualizar(mensaje.id, { partesEnviadas: enviados + 1, idsSalida: ids });
        }
        await Mensajes.actualizar(mensaje.id, { estado: 'ENVIADO', leaseHasta: null });
      }
    } catch (error) {
      // No se reejecuta a ciegas la IA: una llamada que agotó el tiempo pudo haber creado una reserva.
      // Tampoco se reenvía automáticamente un mensaje que Meta pudo haber aceptado antes del timeout.
      const codigo = String(error.code || error.message || 'ERROR_META').replace(/[^A-Za-z0-9_ :.-]/g, '').slice(0, 180);
      console.error('Meta: mensaje pendiente de revisión', mensaje?.id || 'cola', codigo);
      if (mensaje) {
        const datos = { estado: 'ERROR', leaseHasta: null, ultimoError: `${mensaje.estado}: ${codigo}` };
        if (mensaje.estado === 'PROCESANDO') {
          datos.estado = 'RESPUESTA_LISTA';
          datos.respuesta = mensaje.medio?.id ?
            'No pude completar el registro del comprobante. La cita no se confirmó; consulta el estado de tu reserva antes de reenviarlo.' :
            'No pude comprobar el resultado de tu solicitud. Escríbeme para revisar el estado de tu reserva antes de volver a intentarlo.';
        }
        await Mensajes.actualizar(mensaje.id, datos).catch(() => {});
      }
    } finally { trabajando = false; }
  }
  const intervalo = setInterval(() => { if (!trabajando && !detenido) trabajoActual = paso(); }, 1000);
  intervalo.unref();
  return async function detener() {
    detenido = true;
    clearInterval(intervalo);
    await trabajoActual;
  };
}

module.exports = { iniciarProcesador };
