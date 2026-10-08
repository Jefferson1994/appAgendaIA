const prisma = require('../shared/prisma');

// Asignaciones (profesional + precio propio) de un servicio. Con profesionalId se limita a las de ese profesional.
const incluirAsignaciones = (profesionalId) => ({
  profesionales: {
    where: { activo: true, ...(profesionalId ? { profesionalId } : {}) },
    include: { profesional: true }
  }
});

function listar({ organizacionId, profesionalId, texto, incluirInactivos }, db = prisma) {
  const where = { organizacionId };

  if (!incluirInactivos) {
    where.activo = true;
  }

  // Un profesional solo ve los servicios que él ofrece.
  if (profesionalId) {
    where.profesionales = { some: { profesionalId, activo: true } };
  }

  if (texto) {
    const coincide = { contains: texto, mode: 'insensitive' };
    where.OR = [{ nombre: coincide }, { descripcion: coincide }];
  }

  return db.servicio.findMany({
    where,
    include: incluirAsignaciones(profesionalId),
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }]
  });
}

// Trae el servicio con TODAS sus asignaciones activas (para decidir si es de un solo profesional).
function buscarPorId(organizacionId, id, db = prisma) {
  return db.servicio.findFirst({
    where: { id, organizacionId },
    include: incluirAsignaciones(null)
  });
}

function crear(datos, db = prisma) {
  return db.servicio.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.servicio.update({ where: { id }, data: datos });
}

// Crea o reactiva la asignación de un servicio a un profesional, con su precio y duración propios.
function guardarAsignacion(
  servicioId,
  { profesionalId, precioPersonalizado, duracionPersonalizadaMinutos },
  db = prisma
) {
  const datos = { precioPersonalizado, duracionPersonalizadaMinutos, activo: true };

  return db.profesionalServicio.upsert({
    where: { profesionalId_servicioId: { profesionalId, servicioId } },
    create: { servicioId, profesionalId, ...datos },
    update: datos
  });
}

function quitarAsignaciones(servicioId, profesionalIds, db = prisma) {
  return db.profesionalServicio.updateMany({
    where: { servicioId, profesionalId: { in: profesionalIds } },
    data: { activo: false }
  });
}

// Profesionales activos de la empresa, para validar a quién se le asigna un servicio.
// Profesionales activos de la empresa. Con ids, solo esos; sirve para validar a quién se le asigna un servicio.
function listarProfesionalesActivos(organizacionId, ids = null, db = prisma) {
  return db.profesional.findMany({
    where: { organizacionId, activo: true, ...(ids ? { id: { in: ids } } : {}) },
    select: { id: true }
  });
}

module.exports = {
  listar,
  buscarPorId,
  crear,
  actualizar,
  guardarAsignacion,
  quitarAsignaciones,
  listarProfesionalesActivos
};