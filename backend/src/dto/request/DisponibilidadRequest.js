const { DateTime } = require('luxon');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP } = require('../../config/constantes');
const { validarIdPositivo } = require('../../utils/validaciones');

function normalizarDesde(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return null;
  }

  const texto = String(valor).trim();
  if (!DateTime.fromISO(texto).isValid) {
    throw new AppError(MSG.FECHA_DESDE_INVALIDA, HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// GET /disponibilidad?profesionalId=1&servicioId=1&desde=2026-10-12&dias=7
function validarConsulta(query = {}) {
  return {
    profesionalId: validarIdPositivo(query.profesionalId, 'profesionalId'),
    servicioId: validarIdPositivo(query.servicioId, 'servicioId'),
    desde: normalizarDesde(query.desde),
    dias: query.dias
  };
}

module.exports = { validarConsulta };