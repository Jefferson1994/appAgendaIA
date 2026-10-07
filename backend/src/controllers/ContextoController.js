const CanalesService = require('../services/CanalesService');
const ServiciosService = require('../services/ServiciosService');
const ContextoRequest = require('../dto/request/ContextoRequest');
const ContextoEB = require('../eb/ContextoEB');
const ServicioEB = require('../eb/ServicioEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function resolverPorCanal(req, res) {
  const { identificador } = ContextoRequest.validarCanal(req.params);
  const canal = await CanalesService.resolverCanalActivo(identificador);
  const { relaciones } = await ServiciosService.listarPorCanal(identificador);
  const servicios = relaciones.map((relacion) => new ServicioEB(relacion, canal.profesional));

  return ok(res, new ContextoEB(canal, servicios), MSG.CONTEXTO_OK);
}

module.exports = { resolverPorCanal };
