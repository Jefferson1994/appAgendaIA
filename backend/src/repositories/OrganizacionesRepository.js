const prisma = require('../shared/prisma');

function buscarActivaPorId(id, db = prisma) {
  return db.organizacion.findFirst({ where: { id, activo: true } });
}
function crear(datos, db = prisma) {
  return db.organizacion.create({ data: datos });
}

module.exports = { buscarActivaPorId,crear };