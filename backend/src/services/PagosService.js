const crypto = require('crypto');
const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const {
  HTTP,
  ESTADOS_CITA,
  ESTADOS_PAGO,
  ESTADOS_RESERVA_EXPIRABLES,
  METODO_PAGO,
  PROVEEDOR_PAGO,
  MONEDA_DEFECTO,
  PREFIJO_REFERENCIA_COBRO,
  PORCENTAJE_ANTICIPO_COMPLETO,
  TRANSACCION_OPCIONES
} = require('../config/constantes');
const { expirarReservasVencidas } = require('../shared/reservas');
const CanalesService = require('./CanalesService');
const BloqueosRepository = require('../repositories/BloqueosRepository');
const CitasRepository = require('../repositories/CitasRepository');
const PagosRepository = require('../repositories/PagosRepository');

function calcularSolicitudCobro(cita) {
  const servicio = cita.servicio;

  const porcentaje =
    servicio.porcentajeAnticipo === null
      ? servicio.requierePagoPrevio
        ? PORCENTAJE_ANTICIPO_COMPLETO
        : 0
      : Number(servicio.porcentajeAnticipo);

  if (porcentaje <= 0) {
    throw new AppError(MSG.PAGO_PREVIO_NO_REQUERIDO, HTTP.CONFLICTO);
  }

  return {
    porcentaje,
    montoEsperado: Math.round(Number(cita.precio) * porcentaje) / 100
  };
}

async function solicitarPago({ canalId, citaId }) {
  const canal = await CanalesService.resolverCanalActivo(canalId);

  return prisma.$transaction(async (tx) => {
    await BloqueosRepository.bloquearProfesional(tx, canal.profesionalId);
    await expirarReservasVencidas(tx, canal.profesionalId);

    const cita = await CitasRepository.buscarParaPago(
      { id: citaId, organizacionId: canal.organizacionId, profesionalId: canal.profesionalId },
      tx
    );

    if (!cita) {
      throw new AppError(MSG.CITA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
    }
    if (cita.estado === ESTADOS_CITA.CONFIRMADA) {
      throw new AppError(MSG.CITA_YA_CONFIRMADA, HTTP.CONFLICTO);
    }
    if (cita.estado === ESTADOS_CITA.EXPIRADA) {
      throw new AppError(MSG.RESERVA_EXPIRADA, HTTP.CONFLICTO);
    }
    if (!ESTADOS_RESERVA_EXPIRABLES.includes(cita.estado)) {
      throw new AppError(MSG.CITA_NO_PUEDE_PAGAR, HTTP.CONFLICTO);
    }

    // Si ya hay una solicitud pendiente para esta reserva, se devuelve la misma.
    const pagoVigente = await PagosRepository.buscarPendientePorCita(cita.id, tx);
    if (pagoVigente) {
      return { pago: pagoVigente, creada: false };
    }

    const solicitud = calcularSolicitudCobro(cita);
    const pago = await PagosRepository.crear(
      {
        organizacionId: cita.organizacionId,
        citaId: cita.id,
        montoEsperado: solicitud.montoEsperado,
        metodo: METODO_PAGO.PASARELA,
        estado: ESTADOS_PAGO.PENDIENTE,
        referenciaCobro: `${PREFIJO_REFERENCIA_COBRO}${cita.id}-${crypto.randomUUID().replaceAll('-', '')}`,
        proveedor: PROVEEDOR_PAGO.SIMULADOR,
        moneda: MONEDA_DEFECTO,
        porcentajeAnticipoAplicado: solicitud.porcentaje,
        fechaExpiracion: cita.fechaExpiracionReserva
      },
      tx
    );

    if (cita.estado === ESTADOS_CITA.RESERVA_TEMPORAL) {
      await CitasRepository.actualizar(cita.id, { estado: ESTADOS_CITA.PENDIENTE_PAGO }, tx);
    }

    return { pago, creada: true };
  }, TRANSACCION_OPCIONES);
}

module.exports = { solicitarPago };