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
  TRANSACCION_OPCIONES,
  ORIGEN_TRANSACCION,
  ESTADOS_CONCILIACION,
  PUNTAJE_CONCILIACION
} = require('../config/constantes');
const {
  expirarReservasVencidas,
  calcularExpiracionPagoManual,
  calcularExpiracionValidacionManual
} = require('../shared/reservas');
const { mismoMonto } = require('../utils/montos');
const CanalesService = require('./CanalesService');
const CobrosService = require('./CobrosService');
const AccesoService = require('./AccesoService');
const CalendarioService = require('./CalendarioService');
const PayphoneService = require('./pagos/PayphoneService');
const BloqueosRepository = require('../repositories/BloqueosRepository');
const CitasRepository = require('../repositories/CitasRepository');
const PagosRepository = require('../repositories/PagosRepository');
const TransaccionesBancariasRepository = require('../repositories/TransaccionesBancariasRepository');
const ConciliacionesRepository = require('../repositories/ConciliacionesRepository');

function calcularSolicitudCobro(cita) {
  const servicio = cita.servicio;
  const porcentaje = servicio.porcentajeAnticipo === null
    ? (servicio.requierePagoPrevio ? PORCENTAJE_ANTICIPO_COMPLETO : 0)
    : Number(servicio.porcentajeAnticipo);
  if (porcentaje <= 0) throw new AppError(MSG.PAGO_PREVIO_NO_REQUERIDO, HTTP.CONFLICTO);
  return { porcentaje, montoEsperado: Math.round(Number(cita.precio) * porcentaje) / 100 };
}

function proveedorPara(metodo) {
  if (metodo === METODO_PAGO.PASARELA) {
    return PayphoneService.estaConfigurado() ? PROVEEDOR_PAGO.PAYPHONE : PROVEEDOR_PAGO.SIMULADOR;
  }
  return PROVEEDOR_PAGO.MANUAL;
}

async function crearSolicitudPendienteParaCita(cita, db, metodo = METODO_PAGO.PASARELA) {
  const pagoVigente = await PagosRepository.buscarPendientePorCita(cita.id, db);
  if (pagoVigente) {
    // Antes de reportar un pago el cliente puede cambiar de PayPhone a transferencia/efectivo
    // (o viceversa). Se mantiene la misma reserva y se invalida el enlace anterior.
    if (pagoVigente.metodo !== metodo && pagoVigente.estado === ESTADOS_PAGO.PENDIENTE) {
      const pagoActualizado = await PagosRepository.actualizar(pagoVigente.id, {
        metodo,
        proveedor: proveedorPara(metodo),
        urlPago: null,
        referenciaSolicitudProveedor: null,
        referenciaProveedor: null,
        referenciaBancaria: null
      }, db);
      return { pago: pagoActualizado, creada: false, cita, metodoActualizado: true };
    }
    return { pago: pagoVigente, creada: false, cita, metodoActualizado: false };
  }

  const solicitud = calcularSolicitudCobro(cita);
  const pago = await PagosRepository.crear({
    organizacionId: cita.organizacionId,
    citaId: cita.id,
    montoEsperado: solicitud.montoEsperado,
    metodo,
    estado: ESTADOS_PAGO.PENDIENTE,
    referenciaCobro: `${PREFIJO_REFERENCIA_COBRO}${cita.id}-${crypto.randomUUID().replaceAll('-', '')}`,
    proveedor: proveedorPara(metodo),
    moneda: MONEDA_DEFECTO,
    porcentajeAnticipoAplicado: solicitud.porcentaje,
    fechaExpiracion: cita.fechaExpiracionReserva
  }, db);

  const citaActualizada = cita.estado === ESTADOS_CITA.RESERVA_TEMPORAL
    ? await CitasRepository.actualizar(cita.id, { estado: ESTADOS_CITA.PENDIENTE_PAGO }, db)
    : cita;
  return { pago, creada: true, cita: citaActualizada, metodoActualizado: false };
}

async function prepararPagoPayphone(pago, cita) {
  if (pago.proveedor !== PROVEEDOR_PAGO.PAYPHONE || pago.urlPago) return pago;
  // Se persiste antes de llamar a PayPhone: un reintento por timeout reutiliza la misma
  // referencia externa en vez de crear enlaces diferentes para el mismo pago.
  const pagoConReferencia = pago.referenciaSolicitudProveedor
    ? pago
    : await PagosRepository.actualizar(pago.id, {
        referenciaSolicitudProveedor: PayphoneService.generarReferenciaSolicitud(pago.id)
      });
  const enlace = await PayphoneService.crearLink({ pago: pagoConReferencia, cita });
  return PagosRepository.actualizar(pago.id, enlace);
}

// Debe ejecutarse fuera de la transacción: PayPhone es una llamada de red y no debe mantener
// bloqueado el horario mientras el proveedor responde.
async function completarSolicitudPago({ pago, cita, servicio = null }) {
  if (!pago) return null;
  return prepararPagoPayphone(pago, { ...cita, servicio: cita.servicio || servicio });
}

async function solicitarPago({ canalId, citaId, metodo = METODO_PAGO.PASARELA }) {
  const canal = await CanalesService.resolverCanalActivo(canalId);
  const resultado = await prisma.$transaction(async (tx) => {
    await BloqueosRepository.bloquearProfesional(tx, canal.profesionalId);
    await expirarReservasVencidas(tx, canal.profesionalId);
    const cita = await CitasRepository.buscarParaPago(
      { id: citaId, organizacionId: canal.organizacionId, profesionalId: canal.profesionalId }, tx
    );
    if (!cita) throw new AppError(MSG.CITA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
    if (cita.estado === ESTADOS_CITA.CONFIRMADA) throw new AppError(MSG.CITA_YA_CONFIRMADA, HTTP.CONFLICTO);
    if (cita.estado === ESTADOS_CITA.EXPIRADA) throw new AppError(MSG.RESERVA_EXPIRADA, HTTP.CONFLICTO);
    if (!ESTADOS_RESERVA_EXPIRABLES.includes(cita.estado)) throw new AppError(MSG.CITA_NO_PUEDE_PAGAR, HTTP.CONFLICTO);
    return crearSolicitudPendienteParaCita(cita, tx, metodo);
  }, TRANSACCION_OPCIONES);

  if (
    (resultado.creada || resultado.metodoActualizado) &&
    [METODO_PAGO.TRANSFERENCIA, METODO_PAGO.EFECTIVO].includes(resultado.pago.metodo)
  ) {
    const fechaExpiracion = calcularExpiracionPagoManual();
    resultado.pago = await PagosRepository.actualizar(resultado.pago.id, { fechaExpiracion });
    resultado.cita = await CitasRepository.actualizar(resultado.cita.id, { fechaExpiracionReserva: fechaExpiracion });
  }

  const pago = await completarSolicitudPago(resultado);
  const mediosCobro = pago.metodo === METODO_PAGO.TRANSFERENCIA
    ? await CobrosService.mediosParaCanal(canal)
    : [];
  if (pago.metodo === METODO_PAGO.TRANSFERENCIA && mediosCobro.length === 0) {
    throw new AppError(MSG.MEDIOS_COBRO_NO_CONFIGURADOS, HTTP.NO_DISPONIBLE);
  }
  return { pago, creada: resultado.creada, mediosCobro };
}

async function consultarEstadoReserva({ canalId, citaId, telefono }) {
  const canal = await CanalesService.resolverCanalActivo(canalId);
  return prisma.$transaction(async (tx) => {
    await BloqueosRepository.bloquearProfesional(tx, canal.profesionalId);
    await expirarReservasVencidas(tx, canal.profesionalId);
    const cita = citaId
      ? await CitasRepository.buscarParaPago({ id: citaId, organizacionId: canal.organizacionId, profesionalId: canal.profesionalId }, tx)
      : await CitasRepository.buscarUltimaPorTelefono({ organizacionId: canal.organizacionId, profesionalId: canal.profesionalId, telefono }, tx);
    if (!cita) throw new AppError(MSG.CITA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
    return { cita, pago: await PagosRepository.buscarUltimoPorCita(cita.id, tx) };
  }, TRANSACCION_OPCIONES);
}

async function reportarPagoManual({ canalId, citaId, referenciaBancaria }) {
  const canal = await CanalesService.resolverCanalActivo(canalId);
  const pago = await prisma.$transaction(async (tx) => {
    await BloqueosRepository.bloquearProfesional(tx, canal.profesionalId);
    await expirarReservasVencidas(tx, canal.profesionalId);
    const cita = await CitasRepository.buscarParaPago({ id: citaId, organizacionId: canal.organizacionId, profesionalId: canal.profesionalId }, tx);
    if (!cita) throw new AppError(MSG.CITA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
    const pendiente = await PagosRepository.buscarPendientePorCita(cita.id, tx);
    if (!pendiente || ![METODO_PAGO.TRANSFERENCIA, METODO_PAGO.EFECTIVO].includes(pendiente.metodo)) {
      throw new AppError(MSG.PAGO_MANUAL_NO_ENCONTRADO, HTTP.CONFLICTO);
    }
    const fechaExpiracion = calcularExpiracionValidacionManual();
    const pagoActualizado = await PagosRepository.actualizar(pendiente.id, {
      estado: ESTADOS_PAGO.COMPROBANTE_RECIBIDO,
      referenciaBancaria: referenciaBancaria || pendiente.referenciaBancaria,
      fechaExpiracion
    }, tx);
    await CitasRepository.actualizar(cita.id, { fechaExpiracionReserva: fechaExpiracion }, tx);
    return pagoActualizado;
  }, TRANSACCION_OPCIONES);
  return pago;
}

async function confirmarPagoManual(actor, { pagoId, monto, referenciaBancaria, observacion }) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(actor, {});
  const resultado = await prisma.$transaction(async (tx) => {
    const pagoInicial = await PagosRepository.buscarPorIdConDetalle(pagoId, tx);
    if (!pagoInicial || pagoInicial.organizacionId !== alcance.organizacionId || (alcance.profesionalId && pagoInicial.cita.profesionalId !== alcance.profesionalId)) {
      throw new AppError(MSG.PAGO_MANUAL_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
    }
    await BloqueosRepository.bloquearProfesional(tx, pagoInicial.cita.profesionalId);
    await expirarReservasVencidas(tx, pagoInicial.cita.profesionalId);
    const pago = await PagosRepository.buscarPorIdConDetalle(pagoId, tx);
    if (pago.estado === ESTADOS_PAGO.CONFIRMADO) return { pago, idempotente: true, citaId: pago.citaId };
    if (!mismoMonto(pago.montoEsperado, monto)) throw new AppError(MSG.MONTO_NO_COINCIDE, HTTP.CONFLICTO);

    const eventoId = `MANUAL-${pago.id}-${crypto.randomUUID()}`;
    const transaccion = await TransaccionesBancariasRepository.crear({
      organizacionId: pago.organizacionId,
      banco: pago.metodo === METODO_PAGO.EFECTIVO ? 'EFECTIVO' : 'TRANSFERENCIA_MANUAL',
      referencia: referenciaBancaria || pago.referenciaBancaria || pago.referenciaCobro,
      monto,
      fechaTransaccion: new Date(),
      origen: ORIGEN_TRANSACCION.MANUAL,
      hashEvento: eventoId,
      payloadRaw: { confirmadoPorUsuarioId: actor.id, observacion: observacion || null }
    }, tx);
    await ConciliacionesRepository.crear({
      pagoId: pago.id,
      transaccionBancariaId: transaccion.id,
      puntajeCoincidencia: PUNTAJE_CONCILIACION.COINCIDE,
      coincideMonto: true,
      coincideReferencia: Boolean(referenciaBancaria || pago.referenciaBancaria),
      coincideFecha: true,
      estado: ESTADOS_CONCILIACION.APROBADA_MANUALMENTE,
      observacion: observacion || MSG.OBSERVACION_PAGO_MANUAL_CONFIRMADO
    }, tx);
    const confirmado = await PagosRepository.actualizar(pago.id, {
      estado: ESTADOS_PAGO.CONFIRMADO,
      montoRecibido: monto,
      referenciaBancaria: referenciaBancaria || pago.referenciaBancaria,
      fechaPago: new Date(),
      fechaConfirmacion: new Date(),
      referenciaProveedor: eventoId
    }, tx);
    const cita = await CitasRepository.buscarPorId(pago.citaId, tx);
    if (cita.estado === ESTADOS_CITA.PENDIENTE_PAGO) {
      await CitasRepository.actualizar(cita.id, { estado: ESTADOS_CITA.CONFIRMADA, fechaExpiracionReserva: null }, tx);
      return { pago: confirmado, idempotente: false, citaId: cita.id, citaConfirmada: true };
    }
    return { pago: confirmado, idempotente: false, citaId: cita.id, citaConfirmada: false };
  }, TRANSACCION_OPCIONES);
  if (resultado.citaConfirmada) await CalendarioService.sincronizarCitaConfirmada(resultado.citaId);
  return resultado;
}

async function listarPendientesManual(actor) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(actor, {});
  return PagosRepository.listarPendientesManual(alcance);
}

module.exports = {
  solicitarPago,
  consultarEstadoReserva,
  crearSolicitudPendienteParaCita,
  completarSolicitudPago,
  reportarPagoManual,
  confirmarPagoManual,
  listarPendientesManual
};
