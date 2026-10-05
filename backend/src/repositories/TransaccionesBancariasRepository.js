const prisma = require('../shared/prisma');

function buscarPorHashEvento(hashEvento, db = prisma) {
  return db.transaccionBancaria.findUnique({ where: { hashEvento } });
}

function crear(datos, db = prisma) {
  return db.transaccionBancaria.create({ data: datos });
}

module.exports = { buscarPorHashEvento, crear };