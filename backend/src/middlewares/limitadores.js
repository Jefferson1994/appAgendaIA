const rateLimit = require('express-rate-limit');
const { fail } = require('../utils/respuesta');
const MSG = require('../config/mensajes');
const { HTTP, LIMITES } = require('../config/constantes');

const crearLimitador = ({ ventanaMs, maximo }) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, MSG.DEMASIADAS_PETICIONES, HTTP.DEMASIADAS_PETICIONES)
  });

module.exports = {
  limitadorGeneral: crearLimitador(LIMITES.GENERAL),
  limitadorEscritura: crearLimitador(LIMITES.ESCRITURA),
  limitadorAutenticacion: crearLimitador(LIMITES.AUTENTICACION)
};