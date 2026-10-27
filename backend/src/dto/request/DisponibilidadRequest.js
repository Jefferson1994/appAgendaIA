const { DateTime } = require('luxon');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP } = require('../../config/constantes');
const { validarIdPositivo } = require('../../utils/validaciones');

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizarDesde(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;

  const texto = String(valor).trim();
  if (!DateTime.fromISO(texto).isValid) {
    throw new AppError(MSG.FECHA_DESDE_INVALIDA, HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// Hora opcional para verificar un horario puntual. No interpreta lenguaje natural:
// n8n debe enviar siempre HH:mm (por ejemplo, 17:00) o dejarla vacia.
function normalizarHora(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  const texto = String(valor).trim();
  if (!FORMATO_HORA.test(texto)) {
    throw new AppError(MSG.DATO_INVALIDO('hora'), HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// GET /disponibilidad?profesionalId=1&servicioId=1&desde=2026-10-12&dias=7&hora=17:00
function validarConsulta(query = {}) {
  return {
    profesionalId: validarIdPositivo(query.profesionalId, 'profesionalId'),
    servicioId: validarIdPositivo(query.servicioId, 'servicioId'),
    desde: normalizarDesde(query.desde),
    dias: query.dias,
    hora: normalizarHora(query.hora)
  };
}

module.exports = { validarConsulta };
