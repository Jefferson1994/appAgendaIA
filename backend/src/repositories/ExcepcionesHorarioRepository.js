const prisma = require('../shared/prisma');

function listarPorRango(profesionalId, desde, hasta, db = prisma) {
  return db.excepcionHorario.findMany({
    where: {
      profesionalId,
      fecha: { gte: desde, lte: hasta }
    }
  });
}

module.exports = { listarPorRango };