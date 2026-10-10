const { LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto, validarTextoOpcional } = require('../../utils/validaciones');
const RegistroUsuarioRequest = require('./RegistroUsuarioRequest');

const CLAVE_MAX = 128;

// POST /perfil/guardar: datos personales del propio usuario. El correo va por /perfil/cambiar-correo.
function validarGuardarPerfil(body = {}) {
  return {
    nombres: validarTexto(body.nombres, 'nombres', LONGITUD_MAX.NOMBRE),
    apellidos: validarTextoOpcional(body.apellidos, 'apellidos', LONGITUD_MAX.NOMBRE),
    ...RegistroUsuarioRequest.validarIdentificacionYContacto(body)
  };
}

// POST /perfil/cambiar-correo: el correo nuevo y la clave actual para confirmar.
function validarCambiarCorreo(body = {}) {
  return {
    claveActual: validarTexto(body.claveActual, 'claveActual', CLAVE_MAX),
    emailNuevo: RegistroUsuarioRequest.validarEmail(body.emailNuevo)
  };
}

module.exports = { validarGuardarPerfil, validarCambiarCorreo };
