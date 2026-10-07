const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const PacientesRepository = require('../repositories/PacientesRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const CanalesService = require('./CanalesService');

async function exigirOrganizacion(organizacionId) {
  const organizacion = await OrganizacionesRepository.buscarActivaPorId(organizacionId);
  if (!organizacion) {
    throw new AppError(MSG.ORGANIZACION_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
  }
  return organizacion;
}

async function listar(organizacionId) {
  await exigirOrganizacion(organizacionId);
  return PacientesRepository.listarActivosPorOrganizacion(organizacionId);
}

async function registrar({ organizacionId, nombre, telefono, direccion }) {
  await exigirOrganizacion(organizacionId);

  const existente = await PacientesRepository.buscarPorTelefono(organizacionId, telefono);
  if (existente) {
    return { nuevo: false, cliente: existente };
  }

  const cliente = await PacientesRepository.crear({ organizacionId, nombre, telefono, direccion });
  return { nuevo: true, cliente };
}

async function registrarPorCanal({ canalId, nombre, telefono, direccion }) {
  const canal = await CanalesService.resolverCanalActivo(canalId);
  return registrar({ organizacionId: canal.organizacionId, nombre, telefono, direccion });
}

module.exports = { listar, registrar, registrarPorCanal };
