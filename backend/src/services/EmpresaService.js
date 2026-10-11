const prisma = require('../shared/prisma');
const { HORARIO_EMPRESA, TIPO_ACCESO, TRANSACCION_OPCIONES } = require('../config/constantes');
const { aHoraDb, exigirFranjasValidas } = require('../utils/horarios');
const AccesoService = require('./AccesoService');
const HorariosRepository = require('../repositories/HorariosRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');

// Pantalla "Mi empresa": por ahora, cuándo abre y cierra. Un profesional o instalación sin
// horario propio usa este, y el horario propio debe caber dentro de él.

// El super admin recibe además las empresas; hasta que elige una, no hay horario.
async function consultar(usuario, { organizacionId }) {
  const esPlataforma = usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;
  const empresas = esPlataforma ? await OrganizacionesRepository.listarActivas() : null;
  if (esPlataforma && !organizacionId) return { empresas, organizacion: null, horarios: [] };

  const { organizacion } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  return { empresas, organizacion, horarios: await HorariosRepository.listarDeOrganizacion(organizacion.id) };
}

// Los horarios que ya tienen los profesionales no se tocan: al calcular la disponibilidad se
// recortan al nuevo horario de la empresa.
async function guardarHorario(usuario, { organizacionId, horarios }) {
  const { organizacion } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  exigirFranjasValidas(horarios, HORARIO_EMPRESA.FRANJAS_POR_DIA_MAX);

  const franjas = horarios.map((franja) => ({
    diaSemana: franja.diaSemana,
    horaInicio: aHoraDb(franja.horaInicio),
    horaFin: aHoraDb(franja.horaFin)
  }));
  await prisma.$transaction((tx) => HorariosRepository.reemplazarDeOrganizacion(organizacion.id, franjas, tx), TRANSACCION_OPCIONES);

  return { empresas: null, organizacion, horarios: await HorariosRepository.listarDeOrganizacion(organizacion.id) };
}

module.exports = { consultar, guardarHorario };
