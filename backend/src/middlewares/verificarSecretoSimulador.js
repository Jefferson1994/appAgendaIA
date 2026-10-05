const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, HEADER_SECRETO_SIMULADOR } = require('../config/constantes');

// Protege el webhook del simulador: no existe en producción y exige un secreto.
function verificarSecretoSimulador(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError(MSG.SIMULADOR_NO_DISPONIBLE, HTTP.NO_ENCONTRADO);
  }

  const secretoConfigurado = process.env.PAGO_SIMULADOR_SECRETO;
  if (!secretoConfigurado) {
    throw new AppError(MSG.SIMULADOR_SIN_CONFIGURAR, HTTP.NO_DISPONIBLE);
  }

  if (req.get(HEADER_SECRETO_SIMULADOR) !== secretoConfigurado) {
    throw new AppError(MSG.WEBHOOK_NO_AUTORIZADO, HTTP.NO_AUTORIZADO);
  }

  next();
}

module.exports = verificarSecretoSimulador;