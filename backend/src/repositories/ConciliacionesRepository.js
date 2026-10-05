const prisma = require('../shared/prisma');

function crear(datos, db = prisma) {
  return db.conciliacionPago.create({ data: datos });
}

module.exports = { crear };