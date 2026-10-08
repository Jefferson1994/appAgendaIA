const prisma = require('../shared/prisma');

// Una licencia vale si está activa, ya empezó y todavía no vence.
const vigentes = (ahora) => ({
  activo: true,
  fechaInicio: { lte: ahora },
  OR: [{ fechaFin: null }, { fechaFin: { gt: ahora } }]
});

function listarPorOrganizacion(organizacionId, db = prisma) {
  return db.organizacionModulo.findMany({
    where: { organizacionId },
    include: { modulo: true },
    orderBy: { modulo: { orden: 'asc' } }
  });
}

function listarVigentes(organizacionId, ahora = new Date(), db = prisma) {
  return db.organizacionModulo.findMany({
    where: { organizacionId, ...vigentes(ahora) },
    include: { modulo: true }
  });
}

// Un módulo se licencia una sola vez por empresa; volver a licenciarlo lo actualiza.
function guardar({ organizacionId, moduloId, activo, fechaInicio, fechaFin }, db = prisma) {
  const datos = { activo, fechaInicio, fechaFin };

  return db.organizacionModulo.upsert({
    where: { organizacionId_moduloId: { organizacionId, moduloId } },
    create: { organizacionId, moduloId, ...datos },
    update: datos,
    include: { modulo: true }
  });
}

module.exports = { listarPorOrganizacion, listarVigentes, guardar };