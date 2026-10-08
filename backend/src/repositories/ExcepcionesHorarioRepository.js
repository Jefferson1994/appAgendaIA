const prisma = require('../shared/prisma');
const { TIPOS_EXCEPCION } = require('../config/constantes');

function listarPorRango(profesionalId, desde, hasta, db = prisma) {
  return db.excepcionHorario.findMany({
    where: {
      profesionalId,
      fecha: { gte: desde, lte: hasta }
    }
  });
}

// Bloqueos de horario de una empresa en un rango de fechas, para la pantalla de agenda.
// `desde` y `hasta` son días de calendario (sin hora).
function listarBloqueosAgenda({ organizacionId, profesionalId, desde, hasta }, db = prisma) {
  return db.excepcionHorario.findMany({
    where: {
      tipo: TIPOS_EXCEPCION.BLOQUEO,
      fecha: { gte: desde, lte: hasta },
      profesional: { organizacionId, ...(profesionalId ? { id: profesionalId } : {}) }
    },
    include: { profesional: true },
    orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
  });
}

module.exports = { listarPorRango, listarBloqueosAgenda };