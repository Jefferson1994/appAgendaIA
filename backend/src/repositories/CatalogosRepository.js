const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { nombre: 'asc' }];

// Todos los catálogos con todos sus items (activos e inactivos): pantalla del super admin.
function listarConItems(db = prisma) {
  return db.catalogo.findMany({ orderBy: { nombre: 'asc' }, include: { items: { orderBy: POR_ORDEN } } });
}

function buscarPorId(id, db = prisma) {
  return db.catalogo.findUnique({ where: { id } });
}

// Items activos de un catálogo por su código (p. ej. BANCOS), para listas de opciones.
function listarItemsActivos(codigoCatalogo, db = prisma) {
  return db.catalogoItem.findMany({
    where: { activo: true, catalogo: { codigo: codigoCatalogo, activo: true } },
    orderBy: POR_ORDEN
  });
}

function buscarItem(id, db = prisma) {
  return db.catalogoItem.findUnique({ where: { id }, include: { catalogo: true } });
}

function buscarItemPorCodigo(codigoCatalogo, codigoItem, db = prisma) {
  return db.catalogoItem.findFirst({
    where: { codigo: codigoItem, catalogo: { codigo: codigoCatalogo } },
    include: { catalogo: true }
  });
}

function crearItem(datos, db = prisma) {
  return db.catalogoItem.create({ data: datos });
}

function actualizarItem(id, datos, db = prisma) {
  return db.catalogoItem.update({ where: { id }, data: datos });
}

module.exports = {
  listarConItems,
  buscarPorId,
  listarItemsActivos,
  buscarItem,
  buscarItemPorCodigo,
  crearItem,
  actualizarItem
};
