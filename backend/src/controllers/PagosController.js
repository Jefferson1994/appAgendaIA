const PagosService = require('../services/PagosService');
const SolicitudPagoRequest = require('../dto/request/SolicitudPagoRequest');
const ConsultaPagoRequest = require('../dto/request/ConsultaPagoRequest');
const PagoEB = require('../eb/PagoEB');
const EstadoReservaPagoEB = require('../eb/EstadoReservaPagoEB');
const MSG = require('../config/mensajes');
const { ESTADO, HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

async function solicitar(req, res) {
  const datos = SolicitudPagoRequest.validarSolicitud(req.body);
  const { pago, creada } = await PagosService.solicitarPago(datos);
  const payload = new PagoEB(pago, creada);

  // Contrato estándar más campos directos para que una herramienta de IA
  // pueda comprobar el resultado antes de informar éxito al cliente.
  return res.status(creada ? HTTP.CREADO : HTTP.OK).json({
    ok: true,
    creada: payload.creada,
    pago: payload.pago,
    estado: ESTADO.OK,
    mensaje: creada ? MSG.PAGO_CREADO : MSG.PAGO_EXISTENTE,
    data: payload
  });
}

async function consultarEstado(req, res) {
  const datos = ConsultaPagoRequest.validarConsulta(req.query);
  const estado = await PagosService.consultarEstadoReserva(datos);

  return ok(res, new EstadoReservaPagoEB(estado), MSG.ESTADO_RESERVA_PAGO_OK);
}

module.exports = { solicitar, consultarEstado };
