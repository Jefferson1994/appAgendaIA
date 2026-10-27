const ESTADOS_RESERVA_EXPIRABLES = [
  'RESERVA_TEMPORAL',
  'PENDIENTE_PAGO'
];

const ESTADOS_CITA_BLOQUEANTES = [
  ...ESTADOS_RESERVA_EXPIRABLES,
  'CONFIRMADA',
  'ATENDIDA'
];

function enteroConfigurado(nombre, defecto, minimo, maximo) {
  const valor = Number(process.env[nombre] ?? defecto);
  if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
    throw new Error(`${nombre} debe ser un entero entre ${minimo} y ${maximo}`);
  }
  return valor;
}

function obtenerMinutosReserva() {
  return enteroConfigurado('MINUTOS_RESERVA', 15, 1, 60);
}

function calcularExpiracionReserva(desde = new Date()) {
  return new Date(desde.getTime() + obtenerMinutosReserva() * 60 * 1000);
}

function calcularExpiracionPagoManual(desde = new Date()) {
  const horas = enteroConfigurado('HORAS_PAGO_MANUAL', 24, 1, 72);
  return new Date(desde.getTime() + horas * 60 * 60 * 1000);
}

function calcularExpiracionValidacionManual(desde = new Date()) {
  const horas = enteroConfigurado('HORAS_VALIDACION_PAGO_MANUAL', 72, 1, 168);
  return new Date(desde.getTime() + horas * 60 * 60 * 1000);
}

async function expirarReservasVencidas(db, profesionalId) {
  const ahora = new Date();
  const where = { estado: { in: ESTADOS_RESERVA_EXPIRABLES }, fechaExpiracionReserva: { lte: ahora } };
  if (profesionalId) where.profesionalId = profesionalId;

  const citas = await db.cita.updateMany({ where, data: { estado: 'EXPIRADA' } });
  const pagos = await db.pago.updateMany({
    where: {
      estado: { in: ['PENDIENTE', 'COMPROBANTE_RECIBIDO', 'EN_CONCILIACION'] },
      fechaExpiracion: { lte: ahora },
      cita: { estado: 'EXPIRADA', ...(profesionalId ? { profesionalId } : {}) }
    },
    data: { estado: 'EXPIRADO' }
  });
  return { citasExpiradas: citas.count, pagosExpirados: pagos.count, count: citas.count };
}

module.exports = {
  ESTADOS_RESERVA_EXPIRABLES,
  ESTADOS_CITA_BLOQUEANTES,
  calcularExpiracionReserva,
  calcularExpiracionPagoManual,
  calcularExpiracionValidacionManual,
  expirarReservasVencidas
};
