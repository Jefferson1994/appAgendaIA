const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP } = require('../../config/constantes');
const { validarIdPositivo } = require('../../utils/validaciones');

const ACCIONES_MAX = 50;

// POST /configuracion-modulos/pantallas/acciones. Acciones del catálogo que se agregan a la pantalla.
function validarAsignarAcciones(body = {}) {
  const { accionIds } = body;
  if (!Array.isArray(accionIds) || accionIds.length === 0 || accionIds.length > ACCIONES_MAX) {
    throw new AppError(MSG.DATO_INVALIDO('accionIds'), HTTP.PETICION_INVALIDA);
  }

  return {
    pantallaId: validarIdPositivo(body.pantallaId, 'pantallaId'),
    accionIds: [...new Set(accionIds.map((id) => validarIdPositivo(id, 'accionIds')))]
  };
}

module.exports = { validarAsignarAcciones };
