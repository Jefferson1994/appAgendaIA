const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, AUTH } = require('../config/constantes');

const ALGORITMO = 'HS256';

function obtenerSecreto() {
  const secreto = process.env.JWT_SECRET;

  if (!secreto) {
    throw new Error('JWT_SECRET no esta configurado en el .env');
  }
  if (process.env.NODE_ENV === 'production' && secreto.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en produccion');
  }
  return secreto;
}

// Access token: JWT de vida corta. Lleva solo quien es; los permisos se leen de la base.
function firmarAccessToken({ usuarioId, email }) {
  return jwt.sign({ email }, obtenerSecreto(), {
    algorithm: ALGORITMO,
    subject: String(usuarioId),
    expiresIn: AUTH.ACCESS_EXPIRA
  });
}

function verificarAccessToken(token) {
  const secreto = obtenerSecreto();

  try {
    const payload = jwt.verify(token, secreto, { algorithms: [ALGORITMO] });
    return { usuarioId: Number(payload.sub), email: payload.email };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(MSG.SESION_EXPIRADA, HTTP.NO_AUTORIZADO);
    }
    throw new AppError(MSG.TOKEN_INVALIDO, HTTP.NO_AUTORIZADO);
  }
}

function hashearRefresh(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Refresh token: texto aleatorio (no es JWT). En la base solo se guarda su hash.
function generarRefreshToken() {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: hashearRefresh(token) };
}

module.exports = {
  firmarAccessToken,
  verificarAccessToken,
  generarRefreshToken,
  hashearRefresh
};