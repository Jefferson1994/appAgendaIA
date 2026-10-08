const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const asyncHandler = require('./asyncHandler');
const AccesoService = require('../services/AccesoService');

// Rutas reservadas a ciertos tipos de usuario. Ej: exigirTipoAcceso(TIPO_ACCESO.SUPER_ADMIN)
const exigirTipoAcceso = (...tipos) => (req, res, next) => {
  if (!tipos.includes(req.usuario.tipoAcceso)) {
    return next(new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO));
  }
  return next();
};

// Rutas que piden un permiso concreto. Ej: exigirPermiso(PERMISOS.USUARIOS_GESTIONAR)
const exigirPermiso = (codigo) =>
  asyncHandler(async (req, res, next) => {
    const permisos = await AccesoService.permisosDe(req.usuario);

    if (!permisos.includes(codigo)) {
      throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
    }

    req.permisos = permisos;
    next();
  });

module.exports = { exigirTipoAcceso, exigirPermiso };