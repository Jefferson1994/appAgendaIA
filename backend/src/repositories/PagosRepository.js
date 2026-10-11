const prisma = require('../shared/prisma');
const { ESTADOS_PAGO } = require('../config/constantes');

function buscarPendientePorCita(citaId, db = prisma) {
  return db.pago.findFirst({
    where: { citaId, estado: ESTADOS_PAGO.PENDIENTE },
    orderBy: { fechaCreacion: 'desc' }
  });
}

function buscarUltimoPorCita(citaId, db = prisma) {
  return db.pago.findFirst({
    where: { citaId },
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

// El personal confirma a mano que recibió el pago (transferencia, efectivo) de una cita.
function confirmarPendientesDeCita(citaId, fechaConfirmacion, db = prisma) {
  return db.$executeRaw`
    UPDATE pagos
    SET estado = 'CONFIRMADO', monto_recibido = monto_esperado, fecha_confirmacion = ${fechaConfirmacion},
        fecha_actualizacion = now()
    WHERE cita_id = ${citaId} AND estado IN ('PENDIENTE', 'COMPROBANTE_RECIBIDO', 'EN_CONCILIACION')
  `;
}

module.exports = {
  confirmarPendientesDeCita,
  buscarPendientePorCita,
  buscarUltimoPorCita,
  buscarPorReferenciaCobro,
  crear,
  actualizar
};
