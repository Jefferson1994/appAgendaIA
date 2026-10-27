const ConciliacionService = require('../services/ConciliacionService');
const EventoSimuladorRequest = require('../dto/request/EventoSimuladorRequest');
const EventoPayphoneRequest = require('../dto/request/EventoPayphoneRequest');
const EventoPagoEB = require('../eb/EventoPagoEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function simulador(req, res) {
  const evento = EventoSimuladorRequest.validarEvento(req.body);
  return ok(res, new EventoPagoEB(await ConciliacionService.procesarEventoSimulador(evento)), MSG.EVENTO_PAGO_PROCESADO);
}

async function payphone(req, res) {
  await ConciliacionService.procesarEventoPayphone(EventoPayphoneRequest.validarEvento(req.body));
  return res.status(200).json({ Response: true, ErrorCode: '000' });
}

module.exports = { simulador, payphone };
