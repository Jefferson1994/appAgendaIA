const ConciliacionService = require('../services/ConciliacionService');
const EventoSimuladorRequest = require('../dto/request/EventoSimuladorRequest');
const EventoPagoEB = require('../eb/EventoPagoEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function simulador(req, res) {
  const evento = EventoSimuladorRequest.validarEvento(req.body);
  const resultado = await ConciliacionService.procesarEventoSimulador(evento);

  return ok(res, new EventoPagoEB(resultado), MSG.EVENTO_PAGO_PROCESADO);
}

module.exports = { simulador };