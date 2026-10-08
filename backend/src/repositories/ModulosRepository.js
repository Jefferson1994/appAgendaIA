const prisma = require('../shared/prisma');

function buscarPorCodigo(codigo, db = prisma) {
  return db.modulo.findUnique({ where: { codigo } });
}

function buscarPorId(id, db = prisma) {
  return db.modulo.findUnique({ where: { id } });
}

function listar(db = prisma) {
  return db.modulo.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
}

function crear(datos, db = prisma) {
  return db.modulo.create({ data: datos });
}

// Sirve también para activar o desactivar: actualizar(id, { activo: false })
function actualizar(id, datos, db = prisma) {
  return db.modulo.update({ where: { id }, data: datos });
}

// Módulos activos con sus pantallas activas y los botones (permisos) de cada una.
function listarActivosConPantallas(db = prisma) {
  return db.modulo.findMany({
    where: { activo: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    include: {
      pantallas: {
        where: { activo: true },
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        include: { permisos: { orderBy: { codigo: 'asc' } } }
      }
    }
  });
}

// Módulos activos con sus pantallas activas y los botones (permisos) de cada una.
function listarActivosConPantallas(db = prisma) {
  return db.modulo.findMany({
    where: { activo: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    include: {
      pantallas: {
        where: { activo: true },
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        include: { permisos: { orderBy: { codigo: 'asc' } } }
      }
    }
  });
}

module.exports = { buscarPorCodigo, buscarPorId, listar, listarActivosConPantallas, crear, actualizar };