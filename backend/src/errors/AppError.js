const { HTTP } = require('../config/constantes');

class AppError extends Error {
  constructor(mensaje, statusCode = HTTP.ERROR_INTERNO) {
    super(mensaje);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
