const { validarTexto } = require('../../utils/validaciones');

const REFRESH_MAX = 200;

// POST /auth/refresh y POST /auth/logout. El body trae { refreshToken }.
function validarRefresh(body = {}) {
  return {
    refreshToken: validarTexto(body.refreshToken, 'refreshToken', REFRESH_MAX)
  };
}

module.exports = { validarRefresh };