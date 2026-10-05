const prisma = require('../shared/prisma');

function buscarActivaPorId(id, db = prisma) {
  return db.organizacion.findFirst({ where: { id, activo: true } });
}

module.exports = { buscarActivaPorId };