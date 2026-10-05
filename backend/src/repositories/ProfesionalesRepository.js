const prisma = require('../shared/prisma');

function buscarActivoPorId(id, db = prisma) {
  return db.profesional.findFirst({
    where: { id, activo: true, organizacion: { activo: true } },
    include: { organizacion: true }
  });
}

module.exports = { buscarActivoPorId };