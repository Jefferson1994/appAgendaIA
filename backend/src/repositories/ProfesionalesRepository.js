const prisma = require('../shared/prisma');

function buscarActivoPorId(id, db = prisma) {
  return db.profesional.findFirst({
    where: { id, activo: true, organizacion: { activo: true } },
    include: { organizacion: true }
  });
}

function listarActivosDeOrganizacion(organizacionId, db = prisma) {
  return db.profesional.findMany({
    where: { organizacionId, activo: true },
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }]
  });
}

function buscarDeOrganizacion(id, organizacionId, db = prisma) {
  return db.profesional.findFirst({ where: { id, organizacionId, activo: true } });
}

function crear(datos, db = prisma) {
  return db.profesional.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.profesional.update({ where: { id }, data: datos });
}

module.exports = { buscarActivoPorId, listarActivosDeOrganizacion, buscarDeOrganizacion, crear, actualizar };
