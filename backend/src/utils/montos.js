const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');

// Valida que sea un número positivo y lo deja con 2 decimales.
function normalizarMonto(valor) {
  const monto = Number(valor);

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new AppError(MSG.MONTO_INVALIDO, HTTP.PETICION_INVALIDA);
  }
  return Math.round(monto * 100) / 100;
}

// Compara en centavos para evitar errores de decimales (0.1 + 0.2).
function mismoMonto(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

module.exports = { normalizarMonto, mismoMonto };