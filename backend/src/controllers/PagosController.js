const PagosService = require('../services/PagosService');
const SolicitudPagoRequest = require('../dto/request/SolicitudPagoRequest');
const PagoEB = require('../eb/PagoEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

async function solicitar(req, res) {
  const datos = SolicitudPagoRequest.validarSolicitud(req.body);
  const { pago, creada } = await PagosService.solicitarPago(datos);

  return ok(
    res,
    new PagoEB(pago, creada),
    creada ? MSG.PAGO_CREADO : MSG.PAGO_EXISTENTE,
    creada ? HTTP.CREADO : HTTP.OK
  );
}

module.exports = { solicitar };