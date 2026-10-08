const prisma = require('../shared/prisma');

function buscarPorCodigo(codigo, db = prisma) {
  return db.pantalla.findUnique({ where: { codigo } });
}

function buscarPorId(id, db = prisma) {
  return db.pantalla.findUnique({ where: { id } });
}

function listarPorModulo(moduloId, db = prisma) {
  return db.pantalla.findMany({
    where: { moduloId },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }]
  });
}

function crear(datos, db = prisma) {
  return db.pantalla.create({ data: datos });
}

// Sirve también para activar o desactivar: actualizar(id, { activo: false })
function actualizar(id, datos, db = prisma) {
  return db.pantalla.update({ where: { id }, data: datos });
}

module.exports = { buscarPorCodigo, buscarPorId, listarPorModulo, crear, actualizar };