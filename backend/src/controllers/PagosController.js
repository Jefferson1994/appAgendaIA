const PagosService = require('../services/PagosService');
const SolicitudPagoRequest = require('../dto/request/SolicitudPagoRequest');
const ConsultaPagoRequest = require('../dto/request/ConsultaPagoRequest');
const PagoManualRequest = require('../dto/request/PagoManualRequest');
const PagoEB = require('../eb/PagoEB');
const EstadoReservaPagoEB = require('../eb/EstadoReservaPagoEB');
const MSG = require('../config/mensajes');
const { ESTADO, HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

async function solicitar(req, res) {
  const datos = SolicitudPagoRequest.validarSolicitud(req.body);
  const { pago, cita, creada, mediosCobro } = await PagosService.solicitarPago(datos);
  const payload = new PagoEB({ ...pago, cita }, creada, mediosCobro);
  return res.status(creada ? HTTP.CREADO : HTTP.OK).json({
    ok: true, creada: payload.creada, pago: payload.pago, cita: payload.cita, estado: ESTADO.OK,
    mensaje: creada ? MSG.PAGO_CREADO : MSG.PAGO_EXISTENTE, data: payload
  });
}

async function opciones(req, res) {
  const { validarTexto } = require('../utils/validaciones');
  const canalId = validarTexto(req.query.canal_id, 'canal_id');
  return ok(res, await PagosService.consultarOpcionesPago(canalId), 'Opciones de pago obtenidas correctamente.');
}

async function consultarEstado(req, res) {
  const datos = ConsultaPagoRequest.validarConsulta(req.query);
  return ok(res, new EstadoReservaPagoEB(await PagosService.consultarEstadoReserva(datos)), MSG.ESTADO_RESERVA_PAGO_OK);
}

async function reportarManual(req, res) {
  const pago = await PagosService.reportarPagoManual(PagoManualRequest.validarReporte(req.body));
  return ok(res, new PagoEB(pago, false), MSG.PAGO_MANUAL_REPORTADO);
}

async function confirmarManual(req, res) {
  const resultado = await PagosService.confirmarPagoManual(req.usuario, PagoManualRequest.validarConfirmacion(req.body));
  return ok(res, new PagoEB(resultado.pago, false), MSG.PAGO_MANUAL_CONFIRMADO);
}

async function pendientesManual(req, res) {
  const pagos = await PagosService.listarPendientesManual(req.usuario);
  return ok(res, pagos.map((pago) => new PagoEB(pago, false)), MSG.PAGOS_MANUALES_OK);
}

module.exports = { solicitar, opciones, consultarEstado, reportarManual, confirmarManual, pendientesManual };
