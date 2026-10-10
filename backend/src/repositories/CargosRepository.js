const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { nombre: 'asc' }];

// Todos (activos e inactivos) con cuántos usuarios los tienen: pantalla del super admin.
function listar(db = prisma) {
  return db.cargo.findMany({ orderBy: POR_ORDEN, include: { _count: { select: { usuarios: true } } } });
}

// Cargos activos de un conjunto de categorías (la subcategoría de la empresa y su categoría general).
function listarActivosDeCategorias(categoriaIds, db = prisma) {
  return db.cargo.findMany({ where: { activo: true, categoriaId: { in: categoriaIds } }, orderBy: POR_ORDEN });
}

function buscarPorId(id, db = prisma) {
  return db.cargo.findUnique({ where: { id } });
}

function crear(datos, db = prisma) {
  return db.cargo.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.cargo.update({ where: { id }, data: datos });
}

module.exports = { listar, listarActivosDeCategorias, buscarPorId, crear, actualizar };
