const ESTADOS_RESERVA_EXPIRABLES = [
  'RESERVA_TEMPORAL',
  'PENDIENTE_PAGO'
];

const ESTADOS_CITA_BLOQUEANTES = [
  ...ESTADOS_RESERVA_EXPIRABLES,
  'CONFIRMADA',
  'ATENDIDA'
];

function obtenerMinutosReserva() {
  const minutos = Number(process.env.MINUTOS_RESERVA ?? 15);

  if (!Number.isSafeInteger(minutos) || minutos < 1 || minutos > 60) {
    throw new Error('MINUTOS_RESERVA debe ser un entero entre 1 y 60');
  }

  return minutos;
}

function calcularExpiracionReserva(desde = new Date()) {
  return new Date(desde.getTime() + obtenerMinutosReserva() * 60 * 1000);
}

async function expirarReservasVencidas(db, profesionalId) {
  const ahora = new Date();
  const where = {
    estado: { in: ESTADOS_RESERVA_EXPIRABLES },
    fechaExpiracionReserva: { lte: ahora }
  };

  if (profesionalId) {
    where.profesionalId = profesionalId;
  }

  const citas = await db.cita.updateMany({
    where,
    data: { estado: 'EXPIRADA' }
  });

  const pagos = await db.pago.updateMany({
    where: {
      estado: 'PENDIENTE',
      fechaExpiracion: { lte: ahora },
      cita: {
        estado: 'EXPIRADA',
        ...(profesionalId ? { profesionalId } : {})
      }
    },
    data: { estado: 'EXPIRADO' }
  });

  return {
    citasExpiradas: citas.count,
    pagosExpirados: pagos.count,
    count: citas.count
  };
}

module.exports = {
  ESTADOS_RESERVA_EXPIRABLES,
  ESTADOS_CITA_BLOQUEANTES,
  obtenerMinutosReserva,
  calcularExpiracionReserva,
  expirarReservasVencidas
};
