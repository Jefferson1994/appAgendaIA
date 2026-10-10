const UsuariosService = require('../services/UsuariosService');
const UsuarioEmpresaRequest = require('../dto/request/UsuarioEmpresaRequest');
const UsuariosEmpresaEB = require('../eb/UsuariosEmpresaEB');
const UsuarioEmpresaEB = require('../eb/UsuarioEmpresaEB');
const CredencialUsuarioEB = require('../eb/CredencialUsuarioEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Usuarios de la empresa del usuario autenticado. El super admin elige la empresa (organizacionId).

const contexto = (req) => ({ usuarioActualId: req.usuario.id });

async function consultar(req, res) {
  const filtro = UsuarioEmpresaRequest.validarConsultaUsuarios(req.body);
  const datos = await UsuariosService.consultar(req.usuario, filtro);
  return ok(res, new UsuariosEmpresaEB(datos, contexto(req)), MSG.USUARIOS_OK);
}

// Al crear responde la credencial (con la clave temporal si no hubo correo); al editar, el usuario.
async function guardar(req, res) {
  const datos = UsuarioEmpresaRequest.validarGuardarUsuario(req.body);
  const resultado = await UsuariosService.guardar(req.usuario, datos);

  if (datos.usuarioId) {
    return ok(res, new UsuarioEmpresaEB(resultado.usuario, contexto(req)), MSG.USUARIO_ACTUALIZADO);
  }
  return ok(res, new CredencialUsuarioEB(resultado, contexto(req)), MSG.USUARIO_CREADO, HTTP.CREADO);
}

async function cambiarEstado(req, res) {
  const datos = UsuarioEmpresaRequest.validarEstadoUsuario(req.body);
  const { usuario } = await UsuariosService.cambiarEstado(req.usuario, datos);

  return ok(res, new UsuarioEmpresaEB(usuario, contexto(req)), MSG.USUARIO_ESTADO_OK);
}

async function restablecerClave(req, res) {
  const datos = UsuarioEmpresaRequest.validarUsuarioId(req.body);
  const resultado = await UsuariosService.restablecerClave(req.usuario, datos);

  return ok(res, new CredencialUsuarioEB(resultado, contexto(req)), MSG.CLAVE_RESTABLECIDA);
}

module.exports = { consultar, guardar, cambiarEstado, restablecerClave };
