const CanalesService = require('../services/CanalesService');
const ContextoRequest = require('../dto/request/ContextoRequest');
const ContextoEB = require('../eb/ContextoEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function resolverPorCanal(req, res) {
  const { identificador } = ContextoRequest.validarCanal(req.params);
  const canal = await CanalesService.resolverCanalActivo(identificador);

  return ok(res, new ContextoEB(canal), MSG.CONTEXTO_OK);
}

module.exports = { resolverPorCanal };