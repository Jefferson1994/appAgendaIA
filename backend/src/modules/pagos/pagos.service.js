const crypto = require('crypto');

const prisma = require('../../shared/prisma');
const {
  expirarReservasVencidas
} = require('../../shared/reservas');

const BLOQUEO_PROFESIONAL = 714215;

function errorApi(statusCode, codigo, mensaje) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  error.codigo = codigo;
  return error;
}

function validarId(valor, campo) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw errorApi(400, 'ID_INVALIDO', `${campo} debe ser un entero positivo`);
  }
  return numero;
}

function validarTexto(valor, campo, maximo = 150) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto || texto.length > maximo) {
    throw errorApi(400, 'DATO_INVALIDO', `${campo} no es válido`);
  }
  return texto;
}

function normalizarMonto(valor) {
  const monto = Number(valor);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw errorApi(400, 'MONTO_INVALIDO', 'monto debe ser un número positivo');
  }
  return Math.round(monto * 100) / 100;
}

function mismoMonto(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

function calcularSolicitudCobro(cita) {
  const porcentaje = cita.servicio.porcentajeAnticipo === null
    ? (cita.servicio.requierePagoPrevio ? 100 : 0)
    : Number(cita.servicio.porcentajeAnticipo);

  if (porcentaje <= 0) {
    throw errorApi(
      409,
      'PAGO_PREVIO_NO_REQUERIDO',
      'Este servicio no requiere pago previo'
    );
  }

  return {
    porcentaje,
    montoEsperado: Math.round(Number(cita.precio) * porcentaje) / 100
  };
}

function respuestaPago(pago, creada) {
  return {
    creada,
    pago: {
      id: pago.id,
      estado: pago.estado,
      proveedor: pago.proveedor,
      referenciaCobro: pago.referenciaCobro,
      montoEsperado: Number(pago.montoEsperado),
      moneda: pago.moneda,
      porcentajeAnticipoAplicado: pago.porcentajeAnticipoAplicado
        ? Number(pago.porcentajeAnticipoAplicado)
        : null,
      fechaExpiracion: pago.fechaExpiracion
        ? pago.fechaExpiracion.toISOString()
        : null,
      urlPago: pago.urlPago
    }
  };
}

async function obtenerCanalActivo(canalId) {
  const identificador = validarTexto(canalId, 'canal_id');
  const canal = await prisma.canalAtencion.findUnique({
    where: { identificador },
    include: { organizacion: true, profesional: true }
  });

  if (
    !canal || !canal.activo || !canal.organizacion.activo ||
    !canal.profesional.activo ||
    canal.organizacionId !== canal.profesional.organizacionId
  ) {
    throw errorApi(404, 'CANAL_INVALIDO', 'Canal de atención no disponible');
  }

  return canal;
}

async function bloquearProfesional(tx, profesionalId) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(
      ${BLOQUEO_PROFESIONAL}::integer,
      ${profesionalId}::integer
    )::text AS bloqueo
  `;
}

async function solicitarPago({ canalId, citaId }) {
  const canal = await obtenerCanalActivo(canalId);
  const idCita = validarId(citaId, 'cita_id');

  return prisma.$transaction(async (tx) => {
    await bloquearProfesional(tx, canal.profesionalId);
    await expirarReservasVencidas(tx, canal.profesionalId);

    const cita = await tx.cita.findFirst({
      where: {
        id: idCita,
        organizacionId: canal.organizacionId,
        profesionalId: canal.profesionalId
      },
      include: { servicio: true }
    });

    if (!cita) {
      throw errorApi(404, 'CITA_INVALIDA', 'Reserva no encontrada para este canal');
    }

    if (cita.estado === 'CONFIRMADA') {
      throw errorApi(409, 'CITA_YA_CONFIRMADA', 'La cita ya está confirmada');
    }

    if (cita.estado === 'EXPIRADA') {
      throw errorApi(409, 'RESERVA_EXPIRADA', 'La reserva temporal ya expiró');
    }

    if (!['RESERVA_TEMPORAL', 'PENDIENTE_PAGO'].includes(cita.estado)) {
      throw errorApi(409, 'ESTADO_CITA_INVALIDO', 'La cita no puede iniciar un pago');
    }

    const pagoVigente = await tx.pago.findFirst({
      where: {
        citaId: cita.id,
        estado: 'PENDIENTE'
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    if (pagoVigente) {
      return respuestaPago(pagoVigente, false);
    }

    const solicitud = calcularSolicitudCobro(cita);
    const pago = await tx.pago.create({
      data: {
        organizacionId: cita.organizacionId,
        citaId: cita.id,
        montoEsperado: solicitud.montoEsperado,
        metodo: 'PASARELA',
        estado: 'PENDIENTE',
        referenciaCobro: `AGI-${cita.id}-${crypto.randomUUID().replaceAll('-', '')}`,
        proveedor: 'SIMULADOR',
        moneda: 'USD',
        porcentajeAnticipoAplicado: solicitud.porcentaje,
        fechaExpiracion: cita.fechaExpiracionReserva
      }
    });

    if (cita.estado === 'RESERVA_TEMPORAL') {
      await tx.cita.update({
        where: { id: cita.id },
        data: { estado: 'PENDIENTE_PAGO' }
      });
    }

    return respuestaPago(pago, true);
  }, { maxWait: 10000, timeout: 20000 });
}

async function procesarWebhookSimulador({ eventoId, referenciaCobro, monto }) {
  const idEvento = validarTexto(eventoId, 'evento_id');
  const referencia = validarTexto(referenciaCobro, 'referencia_cobro', 80);
  const montoRecibido = normalizarMonto(monto);

  const pagoInicial = await prisma.pago.findUnique({
    where: { referenciaCobro: referencia },
    include: { cita: true }
  });

  if (!pagoInicial) {
    throw errorApi(404, 'REFERENCIA_NO_ENCONTRADA', 'La referencia de cobro no existe');
  }

  return prisma.$transaction(async (tx) => {
    const eventoExistente = await tx.transaccionBancaria.findUnique({
      where: { hashEvento: idEvento }
    });

    if (eventoExistente) {
      return {
        idempotente: true,
        resultado: 'EVENTO_YA_PROCESADO',
        pagoId: pagoInicial.id
      };
    }

    const pago = await tx.pago.findUnique({
      where: { referenciaCobro: referencia },
      include: { cita: true }
    });

    await bloquearProfesional(tx, pago.cita.profesionalId);
    await expirarReservasVencidas(tx, pago.cita.profesionalId);

    const cita = await tx.cita.findUnique({ where: { id: pago.citaId } });
    const coincideMonto = mismoMonto(pago.montoEsperado, montoRecibido);

    const transaccion = await tx.transaccionBancaria.create({
      data: {
        organizacionId: pago.organizacionId,
        banco: 'SIMULADOR',
        referencia,
        monto: montoRecibido,
        fechaTransaccion: new Date(),
        origen: 'PASARELA',
        hashEvento: idEvento,
        payloadRaw: {
          proveedor: 'SIMULADOR',
          eventoId: idEvento,
          referenciaCobro: referencia,
          monto: montoRecibido
        }
      }
    });

    await tx.conciliacionPago.create({
      data: {
        pagoId: pago.id,
        transaccionBancariaId: transaccion.id,
        puntajeCoincidencia: coincideMonto ? 100 : 50,
        coincideMonto,
        coincideReferencia: true,
        coincideFecha: true,
        estado: coincideMonto ? 'COINCIDENCIA_AUTOMATICA' : 'REVISION_MANUAL',
        observacion: coincideMonto
          ? 'Pago confirmado por el simulador local.'
          : 'El monto recibido no coincide con el monto esperado.'
      }
    });

    if (!coincideMonto) {
      await tx.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'EN_CONCILIACION',
          montoRecibido,
          fechaPago: new Date()
        }
      });

      return {
        idempotente: false,
        resultado: 'MONTO_EN_REVISION',
        pagoId: pago.id,
        citaId: pago.citaId
      };
    }

    if (pago.estado === 'CONFIRMADO') {
      return {
        idempotente: true,
        resultado: 'PAGO_YA_CONFIRMADO',
        pagoId: pago.id,
        citaId: pago.citaId
      };
    }

    await tx.pago.update({
      where: { id: pago.id },
      data: {
        estado: 'CONFIRMADO',
        montoRecibido,
        fechaPago: new Date(),
        fechaConfirmacion: new Date(),
        referenciaProveedor: idEvento
      }
    });

    if (cita.estado !== 'PENDIENTE_PAGO') {
      return {
        idempotente: false,
        resultado: 'PAGO_TARDIO_SIN_CITA_CONFIRMADA',
        pagoId: pago.id,
        citaId: pago.citaId
      };
    }

    await tx.cita.update({
      where: { id: cita.id },
      data: {
        estado: 'CONFIRMADA',
        fechaExpiracionReserva: null
      }
    });

    return {
      idempotente: false,
      resultado: 'CITA_CONFIRMADA',
      pagoId: pago.id,
      citaId: cita.id
    };
  }, { maxWait: 10000, timeout: 20000 });
}

module.exports = {
  solicitarPago,
  procesarWebhookSimulador
};
