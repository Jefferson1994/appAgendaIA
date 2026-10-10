const prisma = require('../shared/prisma');

const CON_TIPO = { tipo: true };

function crear(datos, db = prisma) {
  return db.documento.create({ data: datos, include: CON_TIPO });
}

function buscarActivo(id, db = prisma) {
  return db.documento.findFirst({ where: { id, activo: true }, include: CON_TIPO });
}

module.exports = { crear, buscarActivo };
