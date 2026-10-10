const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { nombre: 'asc' }];

// Pantallas con sus botones (permisos), la acción de cada uno y cuántos roles lo usan.
const PANTALLAS_CON_BOTONES = {
  pantallas: {
    orderBy: POR_ORDEN,
    include: {
      permisos: {
        orderBy: { codigo: 'asc' },
        include: { accion: true, _count: { select: { roles: true } } }
      }
    }
  }
};

function buscarPorCodigo(codigo, db = prisma) {
  return db.modulo.findUnique({ where: { codigo } });
}

function buscarPorId(id, db = prisma) {
  return db.modulo.findUnique({ where: { id } });
}

function listar(db = prisma) {
  return db.modulo.findMany({ orderBy: POR_ORDEN });
}

function buscarPorIds(ids, db = prisma) {
  return db.modulo.findMany({ where: { id: { in: ids } } });
}

function crear(datos, db = prisma) {
  return db.modulo.create({ data: datos });
}

// Sirve también para activar o desactivar: actualizar(id, { activo: false })
function actualizar(id, datos, db = prisma) {
  return db.modulo.update({ where: { id }, data: datos });
}

// Módulos activos con sus pantallas activas y los botones (permisos) de cada una, con su acción.
function listarActivosConPantallas(db = prisma) {
  return db.modulo.findMany({
    where: { activo: true },
    orderBy: POR_ORDEN,
    include: {
      pantallas: {
        where: { activo: true },
        orderBy: POR_ORDEN,
        include: { permisos: { orderBy: { codigo: 'asc' }, include: { accion: true } } }
      }
    }
  });
}

// Todos los módulos (activos e inactivos) con sus pantallas y botones, para la configuración.
function listarConPantallasYBotones(db = prisma) {
  return db.modulo.findMany({ orderBy: POR_ORDEN, include: PANTALLAS_CON_BOTONES });
}

function buscarConPantallasYBotones(id, db = prisma) {
  return db.modulo.findUnique({ where: { id }, include: PANTALLAS_CON_BOTONES });
}

module.exports = {
  buscarPorCodigo,
  buscarPorId,
  buscarPorIds,
  listar,
  listarActivosConPantallas,
  listarConPantallasYBotones,
  buscarConPantallasYBotones,
  crear,
  actualizar
};
