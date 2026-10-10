const multer = require('multer');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');

// Recibe un solo archivo (campo "archivo") en memoria, con tope de tamaño.
// El tipo real se valida después por sus primeros bytes (DocumentosService), no aquí.
const MAXIMO_MB_DEFECTO = 5;
const BYTES_POR_MB = 1024 * 1024;

const maximoMb = () => Number(process.env.DOCUMENTO_MAX_MB) || MAXIMO_MB_DEFECTO;

const receptor = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maximoMb() * BYTES_POR_MB, files: 1, fields: 5 }
}).single('archivo');

module.exports = (req, res, next) =>
  receptor(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(MSG.DOCUMENTO_DEMASIADO_GRANDE(maximoMb()), HTTP.PETICION_INVALIDA));
    }
    return next(new AppError(MSG.DOCUMENTO_REQUERIDO, HTTP.PETICION_INVALIDA));
  });
