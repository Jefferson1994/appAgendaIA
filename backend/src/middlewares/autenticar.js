const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, AUTH } = require('../config/constantes');
const asyncHandler = require('./asyncHandler');
const proveedor = require('../security/proveedores');
const UsuariosRepository = require('../repositories/UsuariosRepository');

function extraerToken(req) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (!tipo || tipo.toLowerCase() !== AUTH.TIPO_TOKEN.toLowerCase() || !token) {
    throw new AppError(MSG.TOKEN_REQUERIDO, HTTP.NO_AUTORIZADO);
  }
  return token;
}

// Valida el token con el proveedor y deja al usuario (con persona, organización,
// rol y permisos) en req.usuario. La autorización siempre sale de nuestra base.
module.exports = asyncHandler(async (req, res, next) => {
  const identidad = await proveedor.verificarAccessToken(extraerToken(req));
  const usuario = await UsuariosRepository.buscarConAcceso(identidad.usuarioId);

  if (!usuario || !usuario.activo) {
    throw new AppError(MSG.TOKEN_INVALIDO, HTTP.NO_AUTORIZADO);
  }

  req.usuario = usuario;
  next();
});