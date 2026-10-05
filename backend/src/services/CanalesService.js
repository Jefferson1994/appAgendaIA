const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const CanalesRepository = require('../repositories/CanalesRepository');

async function resolverCanalActivo(identificador) {
  const canal = await CanalesRepository.buscarPorIdentificador(identificador);

  if (!canal) {
    throw new AppError(MSG.CANAL_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  if (!canal.activo) {
    throw new AppError(MSG.CANAL_INACTIVO, HTTP.PROHIBIDO);
  }
  if (!canal.organizacion.activo) {
    throw new AppError(MSG.ORGANIZACION_INACTIVA, HTTP.PROHIBIDO);
  }
  if (!canal.profesional.activo) {
    throw new AppError(MSG.PROFESIONAL_INACTIVO, HTTP.PROHIBIDO);
  }
  if (canal.profesional.organizacionId !== canal.organizacionId) {
    throw new AppError(MSG.CANAL_NO_DISPONIBLE, HTTP.NO_ENCONTRADO);
  }

  return canal;
}

module.exports = { resolverCanalActivo };