const crypto = require('crypto');
const prisma = require('../../shared/prisma');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, AUTH, TRANSACCION_OPCIONES } = require('../../config/constantes');
const { hashear, comparar } = require('../passwords');
const {
  firmarAccessToken,
  verificarAccessToken,
  generarRefreshToken,
  hashearRefresh
} = require('../tokens');
const UsuariosRepository = require('../../repositories/UsuariosRepository');
const RefreshTokensRepository = require('../../repositories/RefreshTokensRepository');

const MS_MINUTO = 60 * 1000;
const MS_DIA = 24 * 60 * MS_MINUTO;

// Cuando el correo no existe se compara contra este hash, para que el tiempo de
// respuesta no delate si un correo está registrado o no.
const HASH_FALSO = hashear(crypto.randomBytes(16).toString('hex'));

const credencialesInvalidas = () => new AppError(MSG.CREDENCIALES_INVALIDAS, HTTP.NO_AUTORIZADO);

async function emitirTokens(usuario, familiaId, contexto, db = prisma) {
  const refresh = generarRefreshToken();

  const registro = await RefreshTokensRepository.crear(
    {
      usuarioId: usuario.id,
      tokenHash: refresh.hash,
      familiaId,
      expiraEn: new Date(Date.now() + AUTH.REFRESH_DIAS * MS_DIA),
      ip: contexto.ip || null,
      userAgent: contexto.userAgent ? contexto.userAgent.slice(0, 300) : null
    },
    db
  );

  return {
    registro,
    tokens: {
      accessToken: firmarAccessToken({ usuarioId: usuario.id, email: usuario.email }),
      refreshToken: refresh.token,
      expiresIn: AUTH.ACCESS_EXPIRA_SEGUNDOS,
      tokenType: AUTH.TIPO_TOKEN
    }
  };
}

async function registrarIntentoFallido(usuario) {
  const intentos = usuario.intentosFallidos + 1;

  if (intentos >= AUTH.MAX_INTENTOS_FALLIDOS) {
    await UsuariosRepository.actualizar(usuario.id, {
      intentosFallidos: 0,
      bloqueadoHasta: new Date(Date.now() + AUTH.BLOQUEO_MINUTOS * MS_MINUTO)
    });
    return;
  }

  await UsuariosRepository.actualizar(usuario.id, { intentosFallidos: intentos });
}

async function autenticar({ email, password, ip, userAgent }) {
  const usuario = await UsuariosRepository.buscarPorEmail(email);

  if (usuario && usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    throw new AppError(MSG.CUENTA_BLOQUEADA, HTTP.PROHIBIDO);
  }

  const hash = usuario && usuario.passwordHash ? usuario.passwordHash : await HASH_FALSO;
  const claveCorrecta = await comparar(password, hash);

  if (!usuario || !usuario.passwordHash || !claveCorrecta) {
    if (usuario) {
      await registrarIntentoFallido(usuario);
    }
    throw credencialesInvalidas();
  }

  if (!usuario.activo) {
    throw new AppError(MSG.USUARIO_INACTIVO, HTTP.PROHIBIDO);
  }

  await UsuariosRepository.actualizar(usuario.id, {
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoLogin: new Date()
  });

  const { tokens } = await emitirTokens(usuario, crypto.randomUUID(), { ip, userAgent });
  return { usuarioId: usuario.id, idExterno: null, email: usuario.email, tokens };
}

async function refrescar({ refreshToken, ip, userAgent }) {
  const actual = await RefreshTokensRepository.buscarPorHash(hashearRefresh(refreshToken));

  if (!actual) {
    throw new AppError(MSG.TOKEN_INVALIDO, HTTP.NO_AUTORIZADO);
  }

  // Un refresh ya usado que vuelve a presentarse indica robo: se cierra toda la cadena.
  if (actual.revocadoEn) {
    await RefreshTokensRepository.revocarFamilia(actual.familiaId);
    throw new AppError(MSG.SESION_EXPIRADA, HTTP.NO_AUTORIZADO);
  }

  if (actual.expiraEn <= new Date()) {
    throw new AppError(MSG.SESION_EXPIRADA, HTTP.NO_AUTORIZADO);
  }

  const usuario = await UsuariosRepository.buscarConAcceso(actual.usuarioId);
  if (!usuario || !usuario.activo) {
    throw new AppError(MSG.TOKEN_INVALIDO, HTTP.NO_AUTORIZADO);
  }

  return prisma.$transaction(async (tx) => {
    const { registro, tokens } = await emitirTokens(usuario, actual.familiaId, { ip, userAgent }, tx);
    await RefreshTokensRepository.revocar(actual.id, registro.id, tx);
    return { usuarioId: usuario.id, idExterno: null, email: usuario.email, tokens };
  }, TRANSACCION_OPCIONES);
}

async function cerrarSesion({ refreshToken }) {
  const actual = await RefreshTokensRepository.buscarPorHash(hashearRefresh(refreshToken));

  if (actual) {
    await RefreshTokensRepository.revocarFamilia(actual.familiaId);
  }
}

// Devuelve la identidad que trae el token; el middleware busca al usuario en la base.
function verificar(token) {
  const { usuarioId, email } = verificarAccessToken(token);
  return { usuarioId, idExterno: null, email };
}

module.exports = { autenticar, refrescar, cerrarSesion, verificarAccessToken: verificar };