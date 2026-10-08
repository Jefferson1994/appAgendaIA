const prisma = require('../shared/prisma');

function armarFiltro({ organizacionId, profesionalId, texto }) {
  const where = { organizacionId, activo: true };

  // Un profesional solo ve a los clientes con los que ha tenido citas.
  if (profesionalId) {
    where.citas = { some: { profesionalId } };
  }

  if (texto) {
    const coincide = { contains: texto, mode: 'insensitive' };
    where.OR = [{ nombre: coincide }, { apellido: coincide }, { telefono: coincide }, { email: coincide }];
  }

  return where;
}

async function listar({ organizacionId, profesionalId, texto, pagina, tamano }, db = prisma) {
  const where = armarFiltro({ organizacionId, profesionalId, texto });

  const [total, clientes] = await Promise.all([
    db.cliente.count({ where }),
    db.cliente.findMany({
      where,
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      skip: (pagina - 1) * tamano,
      take: tamano
    })
  ]);

  return { total, clientes };
}

// Por cada cliente de la página: total de citas, última cita ya pasada y próxima cita.
// Si viene profesionalId, solo cuenta las citas de ese profesional.
async function resumirCitas({ organizacionId, profesionalId, clienteIds, estados, ahora }, db = prisma) {
  const base = {
    organizacionId,
    clienteId: { in: clienteIds },
    estado: { in: estados },
    ...(profesionalId ? { profesionalId } : {})
  };

  const [totales, pasadas, futuras] = await Promise.all([
    db.cita.groupBy({ by: ['clienteId'], where: base, _count: { _all: true } }),
    db.cita.groupBy({
      by: ['clienteId'],
      where: { ...base, fechaInicio: { lte: ahora } },
      _max: { fechaInicio: true }
    }),
    db.cita.groupBy({
      by: ['clienteId'],
      where: { ...base, fechaInicio: { gt: ahora } },
      _min: { fechaInicio: true }
    })
  ]);

  return { totales, pasadas, futuras };
}

module.exports = { listar, resumirCitas };