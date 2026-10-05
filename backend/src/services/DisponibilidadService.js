const { DateTime } = require('luxon');
const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, ZONA_HORARIA_DEFECTO, DISPONIBILIDAD } = require('../config/constantes');
const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');
const ServiciosRepository = require('../repositories/ServiciosRepository');
const HorariosRepository = require('../repositories/HorariosRepository');
const ExcepcionesHorarioRepository = require('../repositories/ExcepcionesHorarioRepository');
const CitasRepository = require('../repositories/CitasRepository');
const { calcularDias } = require('./DisponibilidadCalculador');

const aFechaUtc = (fecha) => new Date(Date.UTC(fecha.year, fecha.month - 1, fecha.day));

function limitarDias(dias) {
  const cantidad = Math.trunc(Number(dias)) || DISPONIBILIDAD.DIAS_DEFECTO;
  return Math.min(Math.max(cantidad, DISPONIBILIDAD.DIAS_MIN), DISPONIBILIDAD.DIAS_MAX);
}

async function obtenerDisponibilidad({ profesionalId, servicioId, desde, dias, db = prisma }) {
  const profesional = await ProfesionalesRepository.buscarActivoPorId(Number(profesionalId), db);
  if (!profesional) {
    throw new AppError(MSG.PROFESIONAL_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }

  const relacion = await ServiciosRepository.buscarPorProfesionalYServicio(
    profesional.id,
    Number(servicioId),
    db
  );
  if (!relacion) {
    throw new AppError(MSG.SERVICIO_NO_OFRECIDO, HTTP.NO_ENCONTRADO);
  }

  const servicio = relacion.servicio;
  const duracionMinutos = relacion.duracionPersonalizadaMinutos ?? servicio.duracionMinutos;
  const precio = Number(relacion.precioPersonalizado ?? servicio.precio);
  const zonaHoraria =
    profesional.zonaHoraria || profesional.organizacion.zonaHoraria || ZONA_HORARIA_DEFECTO;

  const ahora = DateTime.now().setZone(zonaHoraria);
  const fechaInicial = desde
    ? DateTime.fromISO(desde, { zone: zonaHoraria }).startOf('day')
    : ahora.startOf('day');

  if (!fechaInicial.isValid) {
    throw new AppError(MSG.FECHA_DESDE_INVALIDA, HTTP.PETICION_INVALIDA);
  }

  const cantidadDias = limitarDias(dias);
  const fechaFinal = fechaInicial.plus({ days: cantidadDias - 1 }).endOf('day');

  const horarios = await HorariosRepository.listarActivosPorProfesional(profesional.id, db);
  const excepciones = await ExcepcionesHorarioRepository.listarPorRango(
    profesional.id,
    aFechaUtc(fechaInicial),
    aFechaUtc(fechaFinal),
    db
  );
  const citas = await CitasRepository.listarBloqueantesEnRango(
    profesional.id,
    fechaInicial.toUTC().toJSDate(),
    fechaFinal.toUTC().toJSDate(),
    db
  );

  const diasConHorarios = calcularDias({
    fechaInicial,
    cantidadDias,
    duracionMinutos,
    intervaloMinutos: profesional.intervaloAgendaMinutos,
    zonaHoraria,
    ahora,
    horarios,
    excepciones,
    citas
  });

  return { profesional, servicio, precio, duracionMinutos, zonaHoraria, dias: diasConHorarios };
}

module.exports = { obtenerDisponibilidad };