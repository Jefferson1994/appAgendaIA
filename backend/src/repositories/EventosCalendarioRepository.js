const prisma = require('../shared/prisma');

function buscarPorCita(citaId, db = prisma) {
  return db.eventoCalendario.findUnique({ where: { citaId } });
}

function guardar(datos, db = prisma) {
  return db.eventoCalendario.upsert({
    where: { citaId: datos.citaId },
    update: datos,
    create: datos
  });
}

module.exports = { buscarPorCita, guardar };
