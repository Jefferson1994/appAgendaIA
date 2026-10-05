const { ESTADO, HTTP } = require('../config/constantes');
const MSG = require('../config/mensajes');

function ok(res, data = [], mensaje = '', status = HTTP.OK) {
  return res.status(status).json({ estado: ESTADO.OK, mensaje, data });
}

function fail(res, mensaje = MSG.ERROR_GENERICO, status = HTTP.ERROR_INTERNO, data = []) {
  return res.status(status).json({ estado: ESTADO.ERROR, mensaje, data });
}

module.exports = { ok, fail };