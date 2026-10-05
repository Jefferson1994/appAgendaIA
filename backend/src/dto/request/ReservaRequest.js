const { DateTime } = require('luxon');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP } = require('../../config/constantes');
const { validarIdPositivo, validarTexto } = require('../../utils/validaciones');

// Se exige zona horaria explícita, por ejemplo: 2026-10-15T17:00:00.000-05:00
const TERMINA_CON_ZONA = /(?:Z|[+-]\d{2}:\d{2})$/i;

function normalizarFechaInicio(valor) {
  const texto = typeof valor === 'string' ? valor.trim() : '';

  if (!TERMINA_CON_ZONA.test(texto)) {
    throw new AppError(MSG.FECHA_INICIO_SIN_ZONA, HTTP.PETICION_INVALIDA);
  }

  const fecha = DateTime.fromISO(texto, { setZone: true });
  if (!fecha.isValid) {
    throw new AppError(MSG.FECHA_INICIO_INVALIDA, HTTP.PETICION_INVALIDA);
  }
  return fecha;
}

// POST /citas/reservar
function validarReserva(body = {}) {
  return {
    canalId: validarTexto(body.canal_id, 'canal_id'),
    clienteId: validarIdPositivo(body.cliente_id, 'cliente_id'),
    servicioId: validarIdPositivo(body.servicio_id, 'servicio_id'),
    fechaInicio: normalizarFechaInicio(body.fecha_inicio)
  };
}

module.exports = { validarReserva };