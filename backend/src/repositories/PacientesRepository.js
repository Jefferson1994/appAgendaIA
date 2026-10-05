const prisma = require('../shared/prisma');

function listarActivosPorOrganizacion(organizacionId, db = prisma) {
  return db.cliente.findMany({
    where: { organizacionId, activo: true },
    orderBy: { fechaCreacion: 'desc' }
  });
}

function buscarPorTelefono(organizacionId, telefono, db = prisma) {
  return db.cliente.findUnique({
    where: { organizacionId_telefono: { organizacionId, telefono } }
  });
}

function crear({ organizacionId, nombre, telefono, direccion }, db = prisma) {
  return db.cliente.create({
    data: { organizacionId, nombre, telefono, direccion, activo: true }
  });
}

function buscarActivoPorId(organizacionId, id, db = prisma) {
  return db.cliente.findFirst({
    where: { id, organizacionId, activo: true }
  });
}

module.exports = { listarActivosPorOrganizacion, buscarPorTelefono, buscarActivoPorId, crear };