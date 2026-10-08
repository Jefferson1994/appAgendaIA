const AuthService = require('../services/AuthService');
const LoginRequest = require('../dto/request/LoginRequest');
const RefreshRequest = require('../dto/request/RefreshRequest');
const RegistroEmpresaRequest = require('../dto/request/RegistroEmpresaRequest');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Datos del cliente que quedan registrados junto a la sesión.
const contextoDe = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

async function login(req, res) {
  const datos = LoginRequest.validarLogin(req.body);
  const sesion = await AuthService.login(datos, contextoDe(req));

  return ok(res, sesion, MSG.LOGIN_OK);
}

async function refrescar(req, res) {
  const datos = RefreshRequest.validarRefresh(req.body);
  const sesion = await AuthService.refrescar(datos, contextoDe(req));

  return ok(res, sesion, MSG.SESION_RENOVADA);
}

async function logout(req, res) {
  const datos = RefreshRequest.validarRefresh(req.body);
  await AuthService.cerrarSesion(datos);

  return ok(res, null, MSG.SESION_CERRADA);
}



async function registrarEmpresa(req, res) {
  const datos = RegistroEmpresaRequest.validarRegistroEmpresa(req.body);
  const sesion = await AuthService.registrarEmpresa(datos, contextoDe(req));

  return ok(res, sesion, MSG.REGISTRO_EMPRESA_OK, HTTP.CREADO);
}

// Requiere el middleware de autenticación, que deja el usuario cargado en req.usuario.
async function yo(req, res) {
  const usuario = await AuthService.describirUsuario(req.usuario);

  return ok(res, usuario, MSG.USUARIO_ACTUAL_OK);
}

module.exports = { login, refrescar, logout, registrarEmpresa, yo };