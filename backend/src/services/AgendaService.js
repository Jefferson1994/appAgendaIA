const { DateTime } = require('luxon');
const { AGENDA, ZONA_HORARIA_DEFECTO } = require('../config/constantes');
const AccesoService = require('./AccesoService');
const CitasRepository = require('../repositories/CitasRepository');
const ExcepcionesHorarioRepository = require('../repositories/ExcepcionesHorarioRepository');



function calcularResumen(citas) {
  const cuantas = (estados) => citas.filter((cita) => estados.includes(cita.estado)).length;

  return {
    total: citas.length,
    confirmadas: cuantas(AGENDA.FILTROS.CONFIRMADAS),
    pendientes: cuantas(AGENDA.FILTROS.PENDIENTES),
    atendidas: cuantas(AGENDA.FILTROS.ATENDIDAS)
  };
}

async function consultar(usuario, { desde, hasta, filtro, profesionalId }) {
  const { organizacionId, profesionalId: profesional } = AccesoService.resolverAlcance(usuario, profesionalId);

  const zona = (usuario.organizacion && usuario.organizacion.zonaHoraria) || ZONA_HORARIA_DEFECTO;
  const primerDia = desde
    ? DateTime.fromISO(desde, { zone: zona })
    : DateTime.now().setZone(zona).startOf('day');
  const ultimoDia = hasta ? DateTime.fromISO(hasta, { zone: zona }) : primerDia;

  const estadosFiltro = AGENDA.FILTROS[filtro];
  // El resumen del día no depende del filtro elegido: siempre cuenta las citas vigentes.
  const estados = [...new Set([...AGENDA.FILTROS.TODAS, ...estadosFiltro])];

  const [citas, bloqueos] = await Promise.all([
    CitasRepository.listarAgenda({
      organizacionId,
      profesionalId: profesional,
      desde: primerDia.startOf('day').toJSDate(),
      hasta: ultimoDia.plus({ days: 1 }).startOf('day').toJSDate(),
      estados,
      ahora: new Date()
    }),
    ExcepcionesHorarioRepository.listarBloqueosAgenda({
      organizacionId,
      profesionalId: profesional,
      desde: DateTime.fromISO(primerDia.toISODate(), { zone: 'utc' }).toJSDate(),
      hasta: DateTime.fromISO(ultimoDia.toISODate(), { zone: 'utc' }).toJSDate()
    })
  ]);

  return {
    citas: citas.filter((cita) => estadosFiltro.includes(cita.estado)),
    bloqueos,
    resumen: calcularResumen(citas.filter((cita) => AGENDA.FILTROS.TODAS.includes(cita.estado))),
    desde: primerDia.toISODate(),
    hasta: ultimoDia.toISODate(),
    zona
  };
}

module.exports = { consultar };