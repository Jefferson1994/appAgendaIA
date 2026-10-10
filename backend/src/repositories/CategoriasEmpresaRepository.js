const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { nombre: 'asc' }];

// Todas (activas e inactivas) con cuántas empresas las usan: pantalla del super admin.
function listar(db = prisma) {
  return db.categoriaEmpresa.findMany({
    orderBy: POR_ORDEN,
    include: { _count: { select: { organizaciones: true, subcategorias: true } } }
  });
}

// Catálogo del registro: categorías generales activas con sus subcategorías activas
// y los cargos activos de ambas.
function listarActivasConCargos(db = prisma) {
  const cargosActivos = { where: { activo: true }, orderBy: POR_ORDEN };
  return db.categoriaEmpresa.findMany({
    where: { activo: true, padreId: null },
    orderBy: POR_ORDEN,
    include: {
      cargos: cargosActivos,
      subcategorias: { where: { activo: true }, orderBy: POR_ORDEN, include: { cargos: cargosActivos } }
    }
  });
}

function buscarPorId(id, db = prisma) {
  return db.categoriaEmpresa.findUnique({ where: { id }, include: { padre: true } });
}

function contarSubcategorias(padreId, db = prisma) {
  return db.categoriaEmpresa.count({ where: { padreId } });
}

function crear(datos, db = prisma) {
  return db.categoriaEmpresa.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.categoriaEmpresa.update({ where: { id }, data: datos });
}

module.exports = { listar, listarActivasConCargos, buscarPorId, contarSubcategorias, crear, actualizar };
