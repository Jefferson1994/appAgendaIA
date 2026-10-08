const prisma = require('../shared/prisma');

function listar(db = prisma) {
  return db.permiso.findMany({ orderBy: [{ categoria: 'asc' }, { codigo: 'asc' }] });
}

function buscarPorCodigos(codigos, db = prisma) {
  return db.permiso.findMany({ where: { codigo: { in: codigos } } });
}

// Para cargar el catálogo de permisos desde el seed; es seguro repetirlo.
function crearOActualizar({ codigo, categoria, descripcion }, db = prisma) {
  return db.permiso.upsert({
    where: { codigo },
    update: { categoria, descripcion },
    create: { codigo, categoria, descripcion }
  });
}

// Los botones de una pantalla son los permisos que apuntan a ella.
function asignarPantalla(codigos, pantallaId, db = prisma) {
  return db.permiso.updateMany({ where: { codigo: { in: codigos } }, data: { pantallaId } });
}

function listarPorPantalla(pantallaId, db = prisma) {
  return db.permiso.findMany({ where: { pantallaId }, orderBy: { codigo: 'asc' } });
}

module.exports = { listar, buscarPorCodigos, crearOActualizar, asignarPantalla, listarPorPantalla };