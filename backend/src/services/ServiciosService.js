const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const CanalesService = require('./CanalesService');
const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');
const ServiciosRepository = require('../repositories/ServiciosRepository');

async function exigirProfesional(profesionalId) {
  const profesional = await ProfesionalesRepository.buscarActivoPorId(profesionalId);
  if (!profesional) {
    throw new AppError(MSG.PROFESIONAL_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return profesional;
}

async function listar(profesionalId, texto) {
  const profesional = await exigirProfesional(profesionalId);
  const relaciones = await ServiciosRepository.listarPorProfesional(profesional.id, texto);

  relaciones.sort((a, b) => a.servicio.nombre.localeCompare(b.servicio.nombre, 'es'));

  return { profesional, relaciones };
}

async function listarPorCanal(canalId, texto) {
  const canal = await CanalesService.resolverCanalActivo(canalId);
  const relaciones = await ServiciosRepository.listarPorProfesional(canal.profesional.id, texto);

  relaciones.sort((a, b) => a.servicio.nombre.localeCompare(b.servicio.nombre, 'es'));

  return { profesional: canal.profesional, relaciones };
}

async function obtenerPorId(profesionalId, servicioId) {
  const profesional = await exigirProfesional(profesionalId);
  const relacion = await ServiciosRepository.buscarPorProfesionalYServicio(profesional.id, servicioId);

  if (!relacion) {
    throw new AppError(MSG.SERVICIO_NO_OFRECIDO, HTTP.NO_ENCONTRADO);
  }

  return { profesional, relacion };
}

module.exports = { listar, listarPorCanal, obtenerPorId };
