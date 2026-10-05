const prisma = require('../shared/prisma');

function listarPorProfesional(profesionalId, texto, db = prisma) {
  const filtroServicio = { activo: true };

  if (texto) {
    filtroServicio.OR = [
      { nombre: { contains: texto, mode: 'insensitive' } },
      { descripcion: { contains: texto, mode: 'insensitive' } }
    ];
  }

  return db.profesionalServicio.findMany({
    where: { profesionalId, activo: true, servicio: filtroServicio },
    include: { servicio: true }
  });
}

function buscarPorProfesionalYServicio(profesionalId, servicioId, db = prisma) {
  return db.profesionalServicio.findFirst({
    where: { profesionalId, servicioId, activo: true, servicio: { activo: true } },
    include: { servicio: true }
  });
}

module.exports = { listarPorProfesional, buscarPorProfesionalYServicio };