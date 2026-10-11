const InicioService = require('../services/InicioService');
const InicioEB = require('../eb/InicioEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

// El resumen sale del usuario autenticado: su empresa (y lo que puede ver) o la plataforma.
async function resumen(req, res) {
  return ok(res, new InicioEB(await InicioService.resumen(req.usuario)), MSG.INICIO_OK);
}

module.exports = { resumen };
