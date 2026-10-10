// Respuesta para el bot (n8n): dónde puede pagar el cliente que escribe a un canal.
// `qrUrl` es relativa al backend; el bot la usa para descargar la imagen y enviarla por WhatsApp.
class MediosCobroCanalEB {
  constructor(medios, { identificador, rutaQr }) {
    this.medios = medios.map((medio) => ({
      id: medio.id,
      tipo: medio.tipo,
      entidad: medio.entidad.nombre,
      tipoCuenta: medio.tipoCuenta ? medio.tipoCuenta.nombre : null,
      numero: medio.numero,
      titular: medio.titular,
      identificacionTitular: medio.identificacionTitular || null,
      alias: medio.alias || null,
      deProfesional: medio.profesionalId !== null,
      qrUrl: medio.qrDocumentoId ? rutaQr(identificador, medio.id) : null
    }));
  }
}

module.exports = MediosCobroCanalEB;
