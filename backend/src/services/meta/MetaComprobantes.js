const prisma = require('../../shared/prisma');
const CanalesService = require('../CanalesService');
const DocumentosService = require('../DocumentosService');
const PagosService = require('../PagosService');
const MetaCliente = require('./MetaCliente');

async function recibir(config, mensaje) {
  const canal = await CanalesService.resolverCanalActivo(mensaje.canalId);
  const telefonos = [mensaje.remitente, `+${mensaje.remitente}`];
  if (/^5939\d{8}$/.test(mensaje.remitente)) telefonos.push(`0${mensaje.remitente.slice(3)}`);
  const pagos = await prisma.pago.findMany({
    where: { organizacionId: canal.organizacionId, metodo: 'TRANSFERENCIA',
      estado: { in: ['PENDIENTE', 'COMPROBANTE_RECIBIDO'] },
      cita: { profesionalId: canal.profesionalId, estado: 'PENDIENTE_PAGO',
        fechaExpiracionReserva: { gt: new Date() }, cliente: { telefono: { in: telefonos }, activo: true } } },
    take: 2
  });
  if (pagos.length !== 1) return pagos.length > 1 ?
    'Tienes varias transferencias pendientes. Indica la fecha de la cita antes de volver a enviar el comprobante para que podamos asociarlo correctamente.' :
    'No encontré una reserva vigente con transferencia pendiente para este número. Primero selecciona transferencia para tu reserva y después envía el comprobante.';
  const pago = pagos[0];
  // Se guarda con los permisos existentes de documentos, sin URL pública al filer.
  const archivo = await MetaCliente.descargarMedio(config, mensaje.medio);
  const documento = await DocumentosService.subir({ organizacionId: canal.organizacionId }, {
    tipoCodigo: 'COMPROBANTE_PAGO', archivo
  });
  await prisma.comprobantePago.create({ data: { pagoId: pago.id, documentoId: documento.id,
    archivoUrl: `/documentos/${documento.id}/archivo` } });
  await PagosService.reportarPagoManual({ canalId: mensaje.canalId, citaId: pago.citaId });
  return 'Recibí y guardé tu comprobante. El profesional revisará si el dinero llegó a su cuenta. El pago queda pendiente de validación; esto todavía no confirma la cita.';
}

module.exports = { recibir };
