const prisma = require('../shared/prisma');
const { ESTADOS_PAGO } = require('../config/constantes');

function buscarPendientePorCita(citaId, db = prisma) {
  return db.pago.findFirst({
    where: { citaId, estado: ESTADOS_PAGO.PENDIENTE },
    orderBy: { fechaCreacion: 'desc' }
  });
}

function buscarPorReferenciaCobro(referenciaCobro, db = prisma) {
  return db.pago.findUnique({
    where: { referenciaCobro },
    include: { cita: true }
  });
}

function crear(datos, db = prisma) {
  return db.pago.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.pago.update({ where: { id }, data: datos });
}

module.exports = { buscarPendientePorCita, buscarPorReferenciaCobro, crear, actualizar };