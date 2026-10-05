const DisponibilidadService = require('../services/DisponibilidadService');
const DisponibilidadRequest = require('../dto/request/DisponibilidadRequest');
const DisponibilidadEB = require('../eb/DisponibilidadEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function consultar(req, res) {
  const consulta = DisponibilidadRequest.validarConsulta(req.query);
  const disponibilidad = await DisponibilidadService.obtenerDisponibilidad(consulta);

  return ok(res, new DisponibilidadEB(disponibilidad), MSG.DISPONIBILIDAD_OK);
}

module.exports = { consultar };