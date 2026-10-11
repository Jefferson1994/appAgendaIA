const prisma = require('../shared/prisma');

function buscarActivoPorId(id, db = prisma) {
  return db.profesional.findFirst({
    where: { id, activo: true, organizacion: { activo: true } },
    include: { organizacion: true }
  });
}

function crear(datos, db = prisma) {
  return db.profesional.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.profesional.update({ where: { id }, data: datos });
}

module.exports = { buscarActivoPorId, crear, actualizar };
