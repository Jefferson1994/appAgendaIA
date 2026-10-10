const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, AUTH } = require('../../config/constantes');
const { validarTexto } = require('../../utils/validaciones');

const CLAVE_MAX = 200;

// POST /auth/cambiar-clave. Lo usa sobre todo el usuario con clave temporal en su primer ingreso.
function validarCambiarClave(body = {}) {
  const claveActual = validarTexto(body.claveActual, 'claveActual', CLAVE_MAX);
  const claveNueva = validarTexto(body.claveNueva, 'claveNueva', CLAVE_MAX);

  if (claveNueva.length < AUTH.CLAVE_MIN_LARGO) {
    throw new AppError(MSG.CLAVE_DEBIL, HTTP.PETICION_INVALIDA);
  }
  if (claveNueva === claveActual) {
    throw new AppError(MSG.CLAVE_IGUAL, HTTP.PETICION_INVALIDA);
  }
  return { claveActual, claveNueva };
}

module.exports = { validarCambiarClave };
