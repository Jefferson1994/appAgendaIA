const prisma = require('../shared/prisma');
const { ESTADOS_PAGO } = require('../config/constantes');

const DETALLE = {
  cita: { include: { cliente: true, servicio: true, profesional: true } },
  comprobantes: { orderBy: { fechaCreacion: 'desc' } }
};

function buscarPendientePorCita(citaId, db = prisma) {
  return db.pago.findFirst({
    where: { citaId, estado: { in: [ESTADOS_PAGO.PENDIENTE, ESTADOS_PAGO.COMPROBANTE_RECIBIDO, ESTADOS_PAGO.EN_CONCILIACION] } },
    orderBy: { fechaCreacion: 'desc' }
  });
}

function buscarUltimoPorCita(citaId, db = prisma) {
  return db.pago.findFirst({ where: { citaId }, orderBy: { fechaCreacion: 'desc' } });
}

function buscarPorReferenciaCobro(referenciaCobro, db = prisma) {
  return db.pago.findUnique({ where: { referenciaCobro }, include: { cita: true } });
}

function buscarPorReferenciaSolicitudProveedor(referenciaSolicitudProveedor, db = prisma) {
  return db.pago.findUnique({ where: { referenciaSolicitudProveedor }, include: { cita: true } });
}

function buscarPorIdConDetalle(id, db = prisma) {
  return db.pago.findUnique({ where: { id }, include: DETALLE });
}

function listarPendientesManual({ organizacionId, profesionalId }, db = prisma) {
  return db.pago.findMany({
    where: {
      organizacionId,
      metodo: { in: ['TRANSFERENCIA', 'EFECTIVO'] },
      estado: { in: [ESTADOS_PAGO.PENDIENTE, ESTADOS_PAGO.COMPROBANTE_RECIBIDO, ESTADOS_PAGO.EN_CONCILIACION] },
      ...(profesionalId ? { cita: { profesionalId } } : {})
    },
    include: DETALLE,
    orderBy: { fechaCreacion: 'asc' }
  });
}

function crear(datos, db = prisma) {
  return db.pago.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.pago.update({ where: { id }, data: datos });
}

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
  buscarPorReferenciaSolicitudProveedor,
  buscarPorIdConDetalle,
  listarPendientesManual,
  crear,
  actualizar
};
