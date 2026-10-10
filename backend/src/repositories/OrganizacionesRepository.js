const prisma = require('../shared/prisma');

function buscarActivaPorId(id, db = prisma) {
  return db.organizacion.findFirst({ where: { id, activo: true } });
}
function crear(datos, db = prisma) {
  return db.organizacion.create({ data: datos });
}

// Empresas activas para elegir en pantallas de plataforma (super admin).
function listarActivas(db = prisma) {
  return db.organizacion.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, nombreComercial: true },
    orderBy: { nombre: 'asc' }
  });
}

function actualizar(id, datos, db = prisma) {
  return db.organizacion.update({ where: { id }, data: datos });
}

module.exports = { buscarActivaPorId, crear, listarActivas, actualizar };