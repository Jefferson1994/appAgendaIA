const prisma = require('../shared/prisma');
const { ESTADOS_SUSCRIPCION } = require('../config/constantes');

const CON_PLAN = { plan: { include: { modulos: { include: { modulo: true } } } } };

// Una suscripción da acceso si está VIGENTE, ya empezó y todavía no vence.
const vigente = (ahora) => ({
  estado: ESTADOS_SUSCRIPCION.VIGENTE,
  fechaInicio: { lte: ahora },
  OR: [{ fechaFin: null }, { fechaFin: { gt: ahora } }]
});

function buscarVigente(organizacionId, ahora = new Date(), db = prisma) {
  return db.suscripcion.findFirst({
    where: { organizacionId, ...vigente(ahora) },
    orderBy: { fechaInicio: 'desc' },
    include: CON_PLAN
  });
}

// Historial completo de planes de la empresa, del más reciente al más antiguo.
function listarPorOrganizacion(organizacionId, db = prisma) {
  return db.suscripcion.findMany({
    where: { organizacionId },
    orderBy: [{ fechaInicio: 'desc' }, { id: 'desc' }],
    include: { plan: true }
  });
}

// Finaliza las suscripciones vigentes o pendientes de la empresa (al cambiar de plan).
// Debe ejecutarse dentro de una transacción (se le pasa "tx" como db).
function finalizarAbiertas(organizacionId, ahora, db = prisma) {
  return db.suscripcion.updateMany({
    where: {
      organizacionId,
      estado: { in: [ESTADOS_SUSCRIPCION.VIGENTE, ESTADOS_SUSCRIPCION.PENDIENTE_PAGO] }
    },
    data: { estado: ESTADOS_SUSCRIPCION.FINALIZADA, fechaFin: ahora }
  });
}

function crear(datos, db = prisma) {
  return db.suscripcion.create({ data: datos, include: CON_PLAN });
}

module.exports = { buscarVigente, listarPorOrganizacion, finalizarAbiertas, crear };
