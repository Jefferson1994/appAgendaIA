const prisma = require('../shared/prisma');

// Profesionales o instalaciones activos de la empresa que se muestran en la agenda, con su
// horario y los servicios que ofrecen. `profesionalId` = quien solo ve lo suyo.
function listarRecursos({ organizacionId, profesionalId, tipos }, db = prisma) {
  return db.profesional.findMany({
    where: {
      organizacionId,
      activo: true,
      tipo: { codigo: { in: tipos } },
      ...(profesionalId ? { id: profesionalId } : {})
    },
    include: {
      tipo: { select: { codigo: true } },
      horarios: { where: { activo: true }, orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }] },
      servicios: {
        where: { activo: true, servicio: { activo: true } },
        include: { servicio: true },
        orderBy: { servicio: { nombre: 'asc' } }
      }
    },
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }]
  });
}

// Clientes (leads) de la empresa por nombre, apellido o teléfono. Con `profesionalId`, solo
// los que ya tuvieron citas con él: un profesional no ve los clientes de otro.
function buscarClientes({ organizacionId, profesionalId, texto, maximo }, db = prisma) {
  const coincide = { contains: texto, mode: 'insensitive' };
  return db.cliente.findMany({
    where: {
      organizacionId,
      activo: true,
      ...(profesionalId ? { citas: { some: { profesionalId } } } : {}),
      OR: [{ nombre: coincide }, { apellido: coincide }, { telefono: coincide }]
    },
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    take: maximo
  });
}

function crearCliente(datos, db = prisma) {
  return db.cliente.create({ data: { ...datos, activo: true } });
}

module.exports = { listarRecursos, buscarClientes, crearCliente };
