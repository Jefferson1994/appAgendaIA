const { Prisma } = require('@prisma/client');
const prisma = require('../shared/prisma');

// Consultas de conteo para el tablero de Inicio. Las fechas llegan ya calculadas en la zona
// horaria que corresponde (rangos [desde, hasta)).

const enRango = (desde, hasta) => ({ gte: desde, lt: hasta });

// ---------- Empresa (profesionalId opcional: rol que solo ve sus citas) ----------

const filtroCitas = ({ organizacionId, profesionalId }) => ({
  organizacionId,
  ...(profesionalId ? { profesionalId } : {})
});

function citasPorEstado(alcance, desde, hasta) {
  return prisma.cita.groupBy({
    by: ['estado'],
    where: { ...filtroCitas(alcance), fechaInicio: enRango(desde, hasta) },
    _count: { _all: true }
  });
}

function contarCitas(alcance, desde, hasta, estados) {
  return prisma.cita.count({
    where: { ...filtroCitas(alcance), fechaInicio: enRango(desde, hasta), estado: { in: estados } }
  });
}

function proximasCitas(alcance, desde, estados, limite) {
  return prisma.cita.findMany({
    where: { ...filtroCitas(alcance), fechaInicio: { gte: desde }, estado: { in: estados } },
    orderBy: { fechaInicio: 'asc' },
    take: limite,
    include: { cliente: true, servicio: true, profesional: true }
  });
}

// Citas por mes (YYYY-MM en la zona de la empresa) desde `desde`.
function citasPorMes({ organizacionId = null, profesionalId = null }, desde, zona) {
  const filtros = [Prisma.sql`fecha_inicio >= ${desde}`];
  if (organizacionId) filtros.push(Prisma.sql`organizacion_id = ${organizacionId}`);
  if (profesionalId) filtros.push(Prisma.sql`profesional_id = ${profesionalId}`);
  return prisma.$queryRaw`
    SELECT to_char(date_trunc('month', fecha_inicio AT TIME ZONE ${zona}), 'YYYY-MM') AS mes, COUNT(*)::int AS total
    FROM citas
    WHERE ${Prisma.join(filtros, ' AND ')}
    GROUP BY 1`;
}

function cobrado({ organizacionId, profesionalId }, desde, hasta, estadoConfirmado) {
  return prisma.pago.aggregate({
    where: {
      organizacionId,
      estado: estadoConfirmado,
      fechaConfirmacion: enRango(desde, hasta),
      ...(profesionalId ? { cita: { profesionalId } } : {})
    },
    _sum: { montoRecibido: true }
  });
}

function contarPagos({ organizacionId, profesionalId }, estados) {
  return prisma.pago.count({
    where: { organizacionId, estado: { in: estados }, ...(profesionalId ? { cita: { profesionalId } } : {}) }
  });
}

function contarClientes(organizacionId, desde = null, hasta = null) {
  return prisma.cliente.count({
    where: { organizacionId, ...(desde ? { fechaCreacion: enRango(desde, hasta) } : {}) }
  });
}

function contarEquipo(organizacionId) {
  return Promise.all([
    prisma.usuario.count({ where: { organizacionId, activo: true } }),
    prisma.profesional.count({ where: { organizacionId, activo: true } })
  ]);
}

function planVigente(organizacionId, estadoVigente) {
  return prisma.suscripcion.findFirst({
    where: { organizacionId, estado: estadoVigente },
    orderBy: { fechaInicio: 'desc' },
    include: { plan: true }
  });
}

// ---------- Plataforma (super admin) ----------

function contarEmpresas(desde = null, hasta = null) {
  return prisma.organizacion.count({
    where: { activo: true, ...(desde ? { fechaCreacion: enRango(desde, hasta) } : {}) }
  });
}

function contarUsuariosDeEmpresas() {
  return prisma.usuario.count({ where: { activo: true, organizacionId: { not: null } } });
}

function suscripcionesVigentes(estadoVigente) {
  return prisma.suscripcion.findMany({
    where: { estado: estadoVigente, organizacion: { activo: true } },
    include: { plan: true }
  });
}

// Módulos comprados sueltos que siguen vigentes y tienen precio.
function modulosSueltosVigentes(ahora) {
  return prisma.organizacionModulo.findMany({
    where: {
      activo: true,
      precio: { not: null },
      organizacion: { activo: true },
      OR: [{ fechaFin: null }, { fechaFin: { gt: ahora } }]
    }
  });
}

function empresasConCategoria() {
  return prisma.organizacion.findMany({
    where: { activo: true },
    select: { categoria: { select: { nombre: true, padre: { select: { nombre: true } } } } }
  });
}

function empresasPorMes(desde, zona) {
  return prisma.$queryRaw`
    SELECT to_char(date_trunc('month', fecha_creacion AT TIME ZONE ${zona}), 'YYYY-MM') AS mes, COUNT(*)::int AS total
    FROM organizaciones
    WHERE fecha_creacion >= ${desde}
    GROUP BY 1`;
}

function contarCitasPlataforma(desde, hasta) {
  return prisma.cita.count({ where: { fechaInicio: enRango(desde, hasta) } });
}

function ultimasEmpresas(limite, estadoVigente) {
  return prisma.organizacion.findMany({
    orderBy: { fechaCreacion: 'desc' },
    take: limite,
    include: {
      categoria: { include: { padre: true } },
      suscripciones: { where: { estado: estadoVigente }, include: { plan: true }, take: 1 }
    }
  });
}

module.exports = {
  citasPorEstado,
  contarCitas,
  proximasCitas,
  citasPorMes,
  cobrado,
  contarPagos,
  contarClientes,
  contarEquipo,
  planVigente,
  contarEmpresas,
  contarUsuariosDeEmpresas,
  suscripcionesVigentes,
  modulosSueltosVigentes,
  empresasConCategoria,
  empresasPorMes,
  contarCitasPlataforma,
  ultimasEmpresas
};
