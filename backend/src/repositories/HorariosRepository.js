const prisma = require('../shared/prisma');

function listarActivosPorProfesional(profesionalId, db = prisma) {
  return db.horarioProfesional.findMany({
    where: { profesionalId, activo: true }
  });
}

// Horario de la empresa (cuándo abre y cierra), ordenado por día y hora.
function listarDeOrganizacion(organizacionId, db = prisma) {
  return db.horarioOrganizacion.findMany({
    where: { organizacionId },
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
  });
}

// Debe ejecutarse dentro de una transacción: reemplaza el horario completo de la empresa.
async function reemplazarDeOrganizacion(organizacionId, franjas, db = prisma) {
  await db.horarioOrganizacion.deleteMany({ where: { organizacionId } });
  if (franjas.length > 0) {
    await db.horarioOrganizacion.createMany({ data: franjas.map((franja) => ({ ...franja, organizacionId })) });
  }
}

module.exports = { listarActivosPorProfesional, listarDeOrganizacion, reemplazarDeOrganizacion };
