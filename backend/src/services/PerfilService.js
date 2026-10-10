const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TRANSACCION_OPCIONES } = require('../config/constantes');
const { comparar } = require('../security/passwords');
const AuthService = require('./AuthService');
const UsuariosRepository = require('../repositories/UsuariosRepository');
const PersonasRepository = require('../repositories/PersonasRepository');
const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');
const RefreshTokensRepository = require('../repositories/RefreshTokensRepository');

const ERROR_UNICO_PRISMA = 'P2002';

// Lo que cada usuario cambia de sí mismo. Si es profesional, su ficha (la que ve el bot)
// queda con los mismos datos.

async function consultar(actor) {
  return UsuariosRepository.buscarConAcceso(actor.id);
}

/** Actualiza los datos personales y devuelve el usuario descrito como en el login (para la sesión). */
async function guardar(actor, datos) {
  try {
    await prisma.$transaction(async (tx) => {
      await PersonasRepository.actualizar(actor.personaId, datos, tx);
      if (actor.profesionalId) {
        await ProfesionalesRepository.actualizar(
          actor.profesionalId,
          { nombre: datos.nombres, apellido: datos.apellidos, telefono: datos.telefono },
          tx
        );
      }
    }, TRANSACCION_OPCIONES);
  } catch (error) {
    if (error && error.code === ERROR_UNICO_PRISMA) throw new AppError(MSG.IDENTIFICACION_YA_REGISTRADA, HTTP.CONFLICTO);
    throw error;
  }
  return AuthService.describirUsuario(await UsuariosRepository.buscarConAcceso(actor.id));
}

/**
 * Cambia el correo (usuario de ingreso) confirmando con la clave actual.
 * Cierra todas las sesiones y abre una nueva con el correo nuevo.
 */
async function cambiarCorreo(actor, { claveActual, emailNuevo }, contexto) {
  const correcta = actor.passwordHash && (await comparar(claveActual, actor.passwordHash));
  if (!correcta) throw new AppError(MSG.CLAVE_ACTUAL_INCORRECTA, HTTP.PETICION_INVALIDA);
  if (emailNuevo === actor.email) throw new AppError(MSG.CORREO_IGUAL, HTTP.PETICION_INVALIDA);
  if (await UsuariosRepository.buscarPorEmail(emailNuevo)) throw new AppError(MSG.CORREO_YA_REGISTRADO, HTTP.CONFLICTO);

  try {
    await prisma.$transaction(async (tx) => {
      await UsuariosRepository.actualizar(actor.id, { email: emailNuevo }, tx);
      await PersonasRepository.actualizar(actor.personaId, { email: emailNuevo }, tx);
      if (actor.profesionalId) await ProfesionalesRepository.actualizar(actor.profesionalId, { email: emailNuevo }, tx);
    }, TRANSACCION_OPCIONES);
  } catch (error) {
    if (error && error.code === ERROR_UNICO_PRISMA) throw new AppError(MSG.CORREO_YA_REGISTRADO, HTTP.CONFLICTO);
    throw error;
  }

  await RefreshTokensRepository.revocarDeUsuario(actor.id);
  return AuthService.login({ email: emailNuevo, password: claveActual }, contexto);
}

module.exports = { consultar, guardar, cambiarCorreo };
