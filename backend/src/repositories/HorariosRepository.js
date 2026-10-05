const prisma = require('../shared/prisma');

function listarActivosPorProfesional(profesionalId, db = prisma) {
  return db.horarioProfesional.findMany({
    where: { profesionalId, activo: true }
  });
}

module.exports = { listarActivosPorProfesional };