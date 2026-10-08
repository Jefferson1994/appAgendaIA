const { LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto } = require('../../utils/validaciones');

const CLAVE_MAX = 200;

// POST /auth/login. En el login no se valida la fuerza de la clave, solo que venga;
// si es incorrecta se responde siempre "Credenciales inválidas".
function validarLogin(body = {}) {
  return {
    email: validarTexto(body.email, 'email', LONGITUD_MAX.TEXTO).toLowerCase(),
    password: validarTexto(body.password, 'password', CLAVE_MAX)
  };
}

module.exports = { validarLogin };