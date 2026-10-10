const prisma = require('../shared/prisma');

const INCLUIR_PERMISOS = { permisos: { include: { permiso: true } } };

// Detalle para la pantalla de roles: permisos, pantallas y cuántos usuarios lo tienen.
const DETALLE = {
  permisos: { include: { permiso: true } },
  pantallas: true,
  _count: { select: { usuarios: true } }
};

function buscarPorId(id, db = prisma) {
  return db.rol.findUnique({ where: { id }, include: INCLUIR_PERMISOS });
}

function buscarDetalle(id, db = prisma) {
  return db.rol.findUnique({ where: { id }, include: DETALLE });
}

// Las plantillas del sistema no pertenecen a ninguna organización.
function buscarPlantillaPorCodigo(codigo, db = prisma) {
  return db.rol.findFirst({
    where: { organizacionId: null, codigo },
    include: INCLUIR_PERMISOS
  });
}

// Busca por código dentro de un ámbito: organizacionId null = plantillas del sistema.
// Hace falta porque la restricción única de la base no compara los null entre sí.
function buscarPorCodigoEnAmbito(organizacionId, codigo, db = prisma) {
  return db.rol.findFirst({ where: { organizacionId, codigo } });
}

// Roles que una organización puede asignar: los suyos y las plantillas del sistema.
function listarVisibles(organizacionId, db = prisma) {
  return db.rol.findMany({
    where: { activo: true, OR: [{ organizacionId }, { organizacionId: null }] },
    include: INCLUIR_PERMISOS,
    orderBy: { nombre: 'asc' }
  });
}

// Plantillas y, si se indica, los roles propios de la organización (activos e inactivos).
function listarParaConfiguracion(organizacionId, db = prisma) {
  const ambitos = organizacionId ? [{ organizacionId: null }, { organizacionId }] : [{ organizacionId: null }];
  return db.rol.findMany({
    where: { OR: ambitos },
    include: DETALLE,
    orderBy: [{ organizacionId: { sort: 'asc', nulls: 'first' } }, { nombre: 'asc' }]
  });
}

function crear(datos, db = prisma) {
  return db.rol.create({ data: datos, include: INCLUIR_PERMISOS });
}

function actualizar(id, datos, db = prisma) {
  return db.rol.update({ where: { id }, data: datos });
}

// Debe ejecutarse dentro de una transacción (se le pasa "tx" como db).
async function reemplazarPermisos(rolId, permisoIds, db = prisma) {
  await db.rolPermiso.deleteMany({ where: { rolId } });
  if (permisoIds.length > 0) {
    await db.rolPermiso.createMany({
      data: permisoIds.map((permisoId) => ({ rolId, permisoId }))
    });
  }
}

function contarPantallas(rolId, db = prisma) {
  return db.rolPantalla.count({ where: { rolId } });
}

// Debe ejecutarse dentro de una transacción (se le pasa "tx" como db).
async function reemplazarPantallas(rolId, pantallaIds, db = prisma) {
  await db.rolPantalla.deleteMany({ where: { rolId } });
  if (pantallaIds.length > 0) {
    await db.rolPantalla.createMany({
      data: pantallaIds.map((pantallaId) => ({ rolId, pantallaId }))
    });
  }
}

module.exports = {
  buscarPorId,
  buscarDetalle,
  buscarPlantillaPorCodigo,
  buscarPorCodigoEnAmbito,
  listarVisibles,
  listarParaConfiguracion,
  crear,
  actualizar,
  reemplazarPermisos,
  contarPantallas,
  reemplazarPantallas
};
