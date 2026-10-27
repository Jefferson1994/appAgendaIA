const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const {
  HTTP,
  ESTADOS_CITA,
  ESTADOS_PAGO,
  ESTADOS_CONCILIACION,
  RESULTADO_EVENTO,
  ORIGEN_TRANSACCION,
  BANCO_SIMULADOR,
  PROVEEDOR_PAGO,
  PUNTAJE_CONCILIACION,
  TRANSACCION_OPCIONES
} = require('../config/constantes');
const { expirarReservasVencidas } = require('../shared/reservas');
const { mismoMonto } = require('../utils/montos');
const CalendarioService = require('./CalendarioService');
const PayphoneService = require('./pagos/PayphoneService');
const BloqueosRepository = require('../repositories/BloqueosRepository');
const CitasRepository = require('../repositories/CitasRepository');
const PagosRepository = require('../repositories/PagosRepository');
const TransaccionesBancariasRepository = require('../repositories/TransaccionesBancariasRepository');
const ConciliacionesRepository = require('../repositories/ConciliacionesRepository');

async function procesarEvento({ pagoInicial, eventoId, monto, proveedor, referencia, payloadRaw, referenciaProveedor }) {
  const resultado = await prisma.$transaction(async (tx) => {
    const eventoExistente = await TransaccionesBancariasRepository.buscarPorHashEvento(eventoId, tx);
    if (eventoExistente) return { idempotente: true, resultado: RESULTADO_EVENTO.EVENTO_YA_PROCESADO, pagoId: pagoInicial.id };

    const pago = await PagosRepository.buscarPorReferenciaCobro(pagoInicial.referenciaCobro, tx);
    await BloqueosRepository.bloquearProfesional(tx, pago.cita.profesionalId);
    await expirarReservasVencidas(tx, pago.cita.profesionalId);
    const cita = await CitasRepository.buscarPorId(pago.citaId, tx);
    const coincideMonto = mismoMonto(pago.montoEsperado, monto);

    const transaccion = await TransaccionesBancariasRepository.crear({
      organizacionId: pago.organizacionId,
      banco: proveedor === PROVEEDOR_PAGO.PAYPHONE ? 'PAYPHONE' : BANCO_SIMULADOR,
      referencia,
      monto,
      fechaTransaccion: new Date(),
      origen: ORIGEN_TRANSACCION.PASARELA,
      hashEvento: eventoId,
      payloadRaw
    }, tx);
    await ConciliacionesRepository.crear({
      pagoId: pago.id,
      transaccionBancariaId: transaccion.id,
      puntajeCoincidencia: coincideMonto ? PUNTAJE_CONCILIACION.COINCIDE : PUNTAJE_CONCILIACION.REVISION,
      coincideMonto,
      coincideReferencia: true,
      coincideFecha: true,
      estado: coincideMonto ? ESTADOS_CONCILIACION.COINCIDENCIA_AUTOMATICA : ESTADOS_CONCILIACION.REVISION_MANUAL,
      observacion: coincideMonto ? MSG.OBSERVACION_PAGO_CONFIRMADO : MSG.OBSERVACION_MONTO_DISTINTO
    }, tx);

    if (!coincideMonto) {
      await PagosRepository.actualizar(pago.id, { estado: ESTADOS_PAGO.EN_CONCILIACION, montoRecibido: monto, fechaPago: new Date() }, tx);
      return { idempotente: false, resultado: RESULTADO_EVENTO.MONTO_EN_REVISION, pagoId: pago.id, citaId: pago.citaId };
    }
    if (pago.estado === ESTADOS_PAGO.CONFIRMADO) {
      return { idempotente: true, resultado: RESULTADO_EVENTO.PAGO_YA_CONFIRMADO, pagoId: pago.id, citaId: pago.citaId };
    }

    await PagosRepository.actualizar(pago.id, {
      estado: ESTADOS_PAGO.CONFIRMADO,
      montoRecibido: monto,
      fechaPago: new Date(),
      fechaConfirmacion: new Date(),
      referenciaProveedor
    }, tx);
    if (cita.estado !== ESTADOS_CITA.PENDIENTE_PAGO) {
      return { idempotente: false, resultado: RESULTADO_EVENTO.PAGO_TARDIO_SIN_CITA_CONFIRMADA, pagoId: pago.id, citaId: pago.citaId };
    }
    await CitasRepository.actualizar(cita.id, { estado: ESTADOS_CITA.CONFIRMADA, fechaExpiracionReserva: null }, tx);
    return { idempotente: false, resultado: RESULTADO_EVENTO.CITA_CONFIRMADA, pagoId: pago.id, citaId: cita.id };
  }, TRANSACCION_OPCIONES);

  if (resultado.resultado === RESULTADO_EVENTO.CITA_CONFIRMADA) {
    await CalendarioService.sincronizarCitaConfirmada(resultado.citaId);
  }
  return resultado;
}

async function procesarEventoSimulador({ eventoId, referenciaCobro, monto }) {
  const pago = await PagosRepository.buscarPorReferenciaCobro(referenciaCobro);
  if (!pago) throw new AppError(MSG.REFERENCIA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
  return procesarEvento({
    pagoInicial: pago,
    eventoId: `SIMULADOR:${eventoId}`,
    monto,
    proveedor: PROVEEDOR_PAGO.SIMULADOR,
    referencia: referenciaCobro,
    referenciaProveedor: eventoId,
    payloadRaw: { proveedor: PROVEEDOR_PAGO.SIMULADOR, eventoId, referenciaCobro, monto }
  });
}

async function procesarEventoPayphone({ transactionId, clientTransactionId, amount, storeId, payload }) {
  if (!PayphoneService.storeIdCoincide(storeId)) throw new AppError(MSG.PAYPHONE_STORE_INVALIDO, HTTP.NO_AUTORIZADO);
  const pago = await PagosRepository.buscarPorReferenciaSolicitudProveedor(clientTransactionId);
  if (!pago || pago.proveedor !== PROVEEDOR_PAGO.PAYPHONE) throw new AppError(MSG.REFERENCIA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
  return procesarEvento({
    pagoInicial: pago,
    eventoId: `PAYPHONE:${transactionId}`,
    monto: amount / 100,
    proveedor: PROVEEDOR_PAGO.PAYPHONE,
    referencia: clientTransactionId,
    referenciaProveedor: String(transactionId),
    payloadRaw: payload
  });
}

module.exports = { procesarEventoSimulador, procesarEventoPayphone };
