const { fail } = require('../utils/respuesta');
const { HTTP } = require('../config/constantes');
const MSG = require('../config/mensajes');

function errorHandler(error, req, res, next) {
  if (error.type === 'entity.parse.failed') {
    return fail(res, MSG.JSON_INVALIDO, HTTP.PETICION_INVALIDA);
  }

  if (Number.isInteger(error.statusCode)) {
    return fail(res, error.message, error.statusCode);
  }

  if (error.code === 'P2002') {
    return fail(res, MSG.REGISTRO_DUPLICADO, HTTP.CONFLICTO);
  }

  if (error.code === 'P2025') {
    return fail(res, MSG.REGISTRO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }

  console.error('Error no controlado:', error);
  return fail(res, MSG.ERROR_INTERNO, HTTP.ERROR_INTERNO);
}

module.exports = errorHandler;