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
    include: { modulo: true },
    orderBy: { modulo: { orden: 'asc' } }
  });
}

function buscarVigente(organizacionId, moduloId, ahora = new Date(), db = prisma) {
  return db.organizacionModulo.findFirst({
    where: { organizacionId, moduloId, ...vigentes(ahora) },
    include: { modulo: true }
  });
}

// Un módulo se licencia una sola vez por empresa; volver a licenciarlo lo actualiza.
// `precio`, `moneda` y `periodicidad` son lo acordado al comprarlo (null si no se cobró,
// como las licencias de desarrollo del seed).
function guardar(
  { organizacionId, moduloId, activo, fechaInicio, fechaFin, precio = null, moneda = null, periodicidad = null },
  db = prisma
) {
  const datos = { activo, fechaInicio, fechaFin, precio, moneda, periodicidad };

  return db.organizacionModulo.upsert({
    where: { organizacionId_moduloId: { organizacionId, moduloId } },
    create: { organizacionId, moduloId, ...datos },
    update: datos,
    include: { modulo: true }
  });
}

// Cancela una licencia: deja de valer desde `ahora` y queda registrada la fecha.
function cancelar(organizacionId, moduloId, ahora, db = prisma) {
  return db.organizacionModulo.update({
    where: { organizacionId_moduloId: { organizacionId, moduloId } },
    data: { activo: false, fechaFin: ahora },
    include: { modulo: true }
  });
}

module.exports = { listarPorOrganizacion, listarVigentes, buscarVigente, guardar, cancelar };
