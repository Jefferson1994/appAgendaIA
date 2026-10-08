const AgendaService = require('../services/AgendaService');
const ConsultaAgendaRequest = require('../dto/request/ConsultaAgendaRequest');
const AgendaEB = require('../eb/AgendaEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

// Requiere autenticar, que deja al usuario cargado en req.usuario.
async function consultar(req, res) {
  const filtros = ConsultaAgendaRequest.validarConsultaAgenda(req.body);
  const agenda = await AgendaService.consultar(req.usuario, filtros);

  return ok(res, new AgendaEB(agenda), MSG.AGENDA_OK);
}

module.exports = { consultar };