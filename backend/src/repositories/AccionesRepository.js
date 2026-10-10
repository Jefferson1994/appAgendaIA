const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { nombre: 'asc' }];

// Catálogo de botones disponibles para las pantallas.
function listarActivas(db = prisma) {
  return db.accion.findMany({ where: { activo: true }, orderBy: POR_ORDEN });
}

function buscarActivasPorIds(ids, db = prisma) {
  return db.accion.findMany({ where: { id: { in: ids }, activo: true }, orderBy: POR_ORDEN });
}

function buscarPorCodigo(codigo, db = prisma) {
  return db.accion.findUnique({ where: { codigo } });
}

function crear(datos, db = prisma) {
  return db.accion.create({ data: datos });
}

module.exports = { listarActivas, buscarActivasPorIds, buscarPorCodigo, crear };
