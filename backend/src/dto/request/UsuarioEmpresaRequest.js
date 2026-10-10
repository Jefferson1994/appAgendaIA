const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../../config/constantes');
const {
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarTexto,
  validarTextoOpcional,
  validarBooleano
} = require('../../utils/validaciones');
const RegistroUsuarioRequest = require('./RegistroUsuarioRequest');
const { validarPersonalEmpresa } = require('./CategoriasRequest');

// `organizacionId` solo lo usa el super admin para elegir la empresa; para el resto
// el servicio lo ignora y toma la empresa del token.
const organizacionDe = (body) => validarIdOpcional(body.organizacionId, 'organizacionId');

// POST /usuarios/consultar
function validarConsultaUsuarios(body = {}) {
  return { organizacionId: organizacionDe(body) };
}

// POST /usuarios/guardar. Con usuarioId edita; sin él, crea con clave temporal.
// El correo solo se fija al crear (es el usuario de ingreso).
// Rol: `esAdministrador` = administrador de la empresa (ve todo); si no, `rolId` es obligatorio.
// Cargo (según el tipo de negocio de la empresa) y `esProfesional`: tiene agenda propia.
function validarGuardarUsuario(body = {}) {
  const usuarioId = validarIdOpcional(body.usuarioId, 'usuarioId');
  const esAdministrador = validarBooleano(body.esAdministrador, 'esAdministrador', false);
  const rolId = esAdministrador ? null : validarIdOpcional(body.rolId, 'rolId');

  if (!esAdministrador && rolId === null) {
    throw new AppError(MSG.CAMPO_OBLIGATORIO('rolId'), HTTP.PETICION_INVALIDA);
  }

  const persona = RegistroUsuarioRequest.validarIdentificacionYContacto(body);

  return {
    organizacionId: organizacionDe(body),
    usuarioId,
    email: usuarioId ? null : RegistroUsuarioRequest.validarEmail(body.email),
    nombres: validarTexto(body.nombres, 'nombres', LONGITUD_MAX.NOMBRE),
    apellidos: validarTextoOpcional(body.apellidos, 'apellidos', LONGITUD_MAX.NOMBRE),
    ...persona,
    esAdministrador,
    rolId,
    ...validarPersonalEmpresa(body),
    profesionalId: estaVacio(body.profesionalId) ? null : validarIdPositivo(body.profesionalId, 'profesionalId')
  };
}

// POST /usuarios/estado
function validarEstadoUsuario(body = {}) {
  return {
    organizacionId: organizacionDe(body),
    usuarioId: validarIdPositivo(body.usuarioId, 'usuarioId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

// POST /usuarios/restablecer-clave
function validarUsuarioId(body = {}) {
  return { organizacionId: organizacionDe(body), usuarioId: validarIdPositivo(body.usuarioId, 'usuarioId') };
}

module.exports = { validarConsultaUsuarios, validarGuardarUsuario, validarEstadoUsuario, validarUsuarioId };
