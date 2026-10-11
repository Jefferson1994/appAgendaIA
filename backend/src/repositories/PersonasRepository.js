const prisma = require('../shared/prisma');

function crear(datos, db = prisma) {
  return db.persona.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.persona.update({ where: { id }, data: datos });
}

module.exports = { crear, actualizar };