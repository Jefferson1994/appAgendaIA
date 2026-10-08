const prisma = require('../shared/prisma');

const INCLUIR_PERMISOS = { permisos: { include: { permiso: true } } };

function buscarPorId(id, db = prisma) {
  return db.rol.findUnique({ where: { id }, include: INCLUIR_PERMISOS });
}

// Las plantillas del sistema no pertenecen a ninguna organización.
function buscarPlantillaPorCodigo(codigo, db = prisma) {
  return db.rol.findFirst({
    where: { organizacionId: null, codigo },
    include: INCLUIR_PERMISOS
  });
}

// Roles que una organización puede asignar: los suyos y las plantillas del sistema.
function listarVisibles(organizacionId, db = prisma) {
  return db.rol.findMany({
    where: { activo: true, OR: [{ organizacionId }, { organizacionId: null }] },
    include: INCLUIR_PERMISOS,
    orderBy: { nombre: 'asc' }
  });
}

function crear(datos, db = prisma) {
  return db.rol.create({ data: datos, include: INCLUIR_PERMISOS });
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
  buscarPlantillaPorCodigo,
  listarVisibles,
  crear,
  reemplazarPermisos,
  contarPantallas,
  reemplazarPantallas
};