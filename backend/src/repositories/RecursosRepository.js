const prisma = require('../shared/prisma');

// Profesionales e instalaciones (tabla profesionales, con su tipo) para su pantalla de configuración.
const DETALLE = {
  tipo: true,
  horarios: { where: { activo: true }, orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }] },
  fotos: { orderBy: { orden: 'asc' } },
  servicios: { where: { activo: true, servicio: { activo: true } }, select: { servicioId: true } },
  usuarios: { select: { email: true } }
};

function listar({ organizacionId, tipoId, profesionalId = null, incluirInactivos }, db = prisma) {
  return db.profesional.findMany({
    where: {
      organizacionId,
      tipoId,
      ...(profesionalId ? { id: profesionalId } : {}),
      ...(incluirInactivos ? {} : { activo: true })
    },
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }, { apellido: 'asc' }],
    include: DETALLE
  });
}

// Un recurso solo se busca dentro de su empresa.
function buscarDeEmpresa(id, organizacionId, db = prisma) {
  return db.profesional.findFirst({ where: { id, organizacionId }, include: DETALLE });
}

function crear(datos, db = prisma) {
  return db.profesional.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.profesional.update({ where: { id }, data: datos });
}

// Debe ejecutarse dentro de una transacción: reemplaza los horarios por la lista dada.
async function reemplazarHorarios(profesionalId, horarios, db = prisma) {
  await db.horarioProfesional.deleteMany({ where: { profesionalId } });
  if (horarios.length > 0) {
    await db.horarioProfesional.createMany({ data: horarios.map((horario) => ({ profesionalId, ...horario })) });
  }
}

// Debe ejecutarse dentro de una transacción: reemplaza las fotos por la lista dada, en ese orden.
async function reemplazarFotos(profesionalId, documentoIds, db = prisma) {
  await db.recursoFoto.deleteMany({ where: { profesionalId } });
  if (documentoIds.length > 0) {
    await db.recursoFoto.createMany({
      data: documentoIds.map((documentoId, orden) => ({ profesionalId, documentoId, orden }))
    });
  }
}

module.exports = { listar, buscarDeEmpresa, crear, actualizar, reemplazarHorarios, reemplazarFotos };
