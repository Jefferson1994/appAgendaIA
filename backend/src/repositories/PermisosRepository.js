const prisma = require('../shared/prisma');

// Un botón con su acción del catálogo y cuántos roles lo tienen asignado.
const DETALLE_BOTON = { accion: true, _count: { select: { roles: true } } };

function listar(db = prisma) {
  return db.permiso.findMany({ orderBy: [{ categoria: 'asc' }, { codigo: 'asc' }] });
}

// Catálogo completo con la pantalla de cada permiso (para calcular el acceso del administrador de empresa).
function listarConPantalla(db = prisma) {
  return db.permiso.findMany({ include: { pantalla: true }, orderBy: { codigo: 'asc' } });
}

function buscarPorCodigos(codigos, db = prisma) {
  return db.permiso.findMany({ where: { codigo: { in: codigos } } });
}

function buscarPorId(id, db = prisma) {
  return db.permiso.findUnique({ where: { id }, include: DETALLE_BOTON });
}

function buscarPorCodigo(codigo, db = prisma) {
  return db.permiso.findUnique({ where: { codigo }, include: { pantalla: true } });
}

// Para cargar el catálogo de permisos desde el seed; es seguro repetirlo.
function crearOActualizar({ codigo, categoria, descripcion }, db = prisma) {
  return db.permiso.upsert({
    where: { codigo },
    update: { categoria, descripcion },
    create: { codigo, categoria, descripcion }
  });
}

function crear(datos, db = prisma) {
  return db.permiso.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.permiso.update({ where: { id }, data: datos });
}

function eliminar(id, db = prisma) {
  return db.permiso.delete({ where: { id } });
}

// Los botones de una pantalla son los permisos que apuntan a ella.
function asignarPantalla(codigos, pantallaId, db = prisma) {
  return db.permiso.updateMany({ where: { codigo: { in: codigos } }, data: { pantallaId } });
}

// Permisos que no son botón de ninguna pantalla (ej. servicios.ver): se asignan a roles aparte.
function listarSinPantalla(db = prisma) {
  return db.permiso.findMany({ where: { pantallaId: null }, orderBy: { codigo: 'asc' } });
}

function listarPorPantalla(pantallaId, db = prisma) {
  return db.permiso.findMany({ where: { pantallaId }, orderBy: { codigo: 'asc' }, include: DETALLE_BOTON });
}

module.exports = {
  listar,
  listarConPantalla,
  buscarPorCodigos,
  buscarPorId,
  buscarPorCodigo,
  crearOActualizar,
  crear,
  actualizar,
  eliminar,
  asignarPantalla,
  listarPorPantalla,
  listarSinPantalla
};
