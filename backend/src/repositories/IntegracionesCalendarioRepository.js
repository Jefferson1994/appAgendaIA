const prisma = require('../shared/prisma');

function buscarActivaPorProfesional(profesionalId, db = prisma) {
  return db.integracionCalendario.findFirst({ where: { profesionalId, activo: true } });
}

function guardar({ profesionalId, calendarId, refreshTokenCifrado, activo = true }, db = prisma) {
  return db.integracionCalendario.upsert({
    where: { profesionalId },
    update: { calendarId, refreshTokenCifrado, activo },
    create: { profesionalId, calendarId, refreshTokenCifrado, activo }
  });
}

function consultarPorProfesional(profesionalId, db = prisma) {
  return db.integracionCalendario.findUnique({ where: { profesionalId } });
}

module.exports = { buscarActivaPorProfesional, guardar, consultarPorProfesional };
