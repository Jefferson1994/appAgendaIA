const PerfilService = require('../services/PerfilService');
const PerfilRequest = require('../dto/request/PerfilRequest');
const PerfilEB = require('../eb/PerfilEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

// Cada usuario solo se toca a sí mismo: el usuario sale del token.

const contextoDe = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

async function consultar(req, res) {
  return ok(res, new PerfilEB(await PerfilService.consultar(req.usuario)), MSG.PERFIL_OK);
}

// Responde el usuario descrito como en el login, para que el front actualice la sesión.
async function guardar(req, res) {
  const datos = PerfilRequest.validarGuardarPerfil(req.body);
  return ok(res, await PerfilService.guardar(req.usuario, datos), MSG.PERFIL_ACTUALIZADO);
}

// Responde una sesión nueva (tokens + usuario): las anteriores quedan cerradas.
async function cambiarCorreo(req, res) {
  const datos = PerfilRequest.validarCambiarCorreo(req.body);
  return ok(res, await PerfilService.cambiarCorreo(req.usuario, datos, contextoDe(req)), MSG.CORREO_ACTUALIZADO);
}

module.exports = { consultar, guardar, cambiarCorreo };
