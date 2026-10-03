const { DateTime } = require('luxon');
const prisma = require('../../shared/prisma');
const {
  obtenerDisponibilidad
} = require('../disponibilidad/disponibilidad.service');

const MINUTOS_RESERVA = 15;

function errorApi(statusCode, codigo, mensaje) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  error.codigo = codigo;
  return error;
}

function validarId(valor, campo) {
  const numero = Number(valor);
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === '' ||
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    throw errorApi(400, 'ID_INVALIDO', `${campo} debe ser un entero positivo`);
  }
  return numero;
}

function respuestaReserva(cita, canal, servicio, zonaHoraria, creada) {
  const inicio = DateTime.fromJSDate(cita.fechaInicio).setZone(zonaHoraria);
  const fin = DateTime.fromJSDate(cita.fechaFin).setZone(zonaHoraria);

  return {
    creada,
    reserva: {
      id: cita.id,
      estado: cita.estado,
      profesional: {
        id: canal.profesional.id,
        nombre: [canal.profesional.nombre, canal.profesional.apellido]
          .filter(Boolean)
          .join(' ')
      },
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre
      },
      fecha: inicio.toISODate(),
      horaInicio: inicio.toFormat('HH:mm'),
      horaFin: fin.toFormat('HH:mm'),
      fechaInicio: cita.fechaInicio.toISOString(),
      fechaFin: cita.fechaFin.toISOString(),
      precio: Number(cita.precio),
      duracionMinutos: cita.duracionMinutos,
      fechaExpiracionReserva: cita.fechaExpiracionReserva
        ? cita.fechaExpiracionReserva.toISOString()
        : null,
      zonaHoraria
    }
  };
}

async function crearReservaTemporal({ canalId, clienteId, servicioId, fechaInicio }) {
  if (typeof canalId !== 'string' || !canalId.trim()) {
    throw errorApi(400, 'CANAL_REQUERIDO', 'canal_id es obligatorio');
  }

  const idCliente = validarId(clienteId, 'cliente_id');
  const idServicio = validarId(servicioId, 'servicio_id');

  // Se exige una fecha ISO con zona horaria, por ejemplo:
  // 2026-10-15T17:00:00.000-05:00
  const fechaTexto = typeof fechaInicio === 'string' ? fechaInicio.trim() : '';
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(fechaTexto)) {
    throw errorApi(
      400,
      'FECHA_INVALIDA',
      'fecha_inicio debe ser ISO 8601 y contener zona horaria'
    );
  }

  const fechaSolicitada = DateTime.fromISO(fechaTexto, { setZone: true });
  if (!fechaSolicitada.isValid) {
    throw errorApi(400, 'FECHA_INVALIDA', 'fecha_inicio no es válida');
  }
  if (fechaSolicitada.toMillis() <= Date.now()) {
    throw errorApi(400, 'FECHA_PASADA', 'El horario debe ser futuro');
  }

  // En el MVP, canal_id procede del cuerpo usado por Postman/n8n.
  // En producción debe resolverse desde el número de destino
  // verificado con la firma de WhatsApp, nunca desde texto del cliente.
  const canal = await prisma.canalAtencion.findUnique({
    where: { identificador: canalId.trim() },
    include: {
      organizacion: true,
      profesional: true
    }
  });

  if (
    !canal ||
    !canal.activo ||
    !canal.organizacion.activo ||
    !canal.profesional.activo ||
    canal.profesional.organizacionId !== canal.organizacionId
  ) {
    throw errorApi(404, 'CANAL_INVALIDO', 'Canal de atención no disponible');
  }

  const zonaHoraria = canal.profesional.zonaHoraria
    || canal.organizacion.zonaHoraria
    || 'America/Guayaquil';
  const fechaLocal = fechaSolicitada.setZone(zonaHoraria).toISODate();

  return prisma.$transaction(async (tx) => {
    // Solo una transacción de reserva por profesional a la vez.
    // Todas las rutas que creen/confirmen/reprogramen citas deberán
    // utilizar este mismo bloqueo. Un constraint en PostgreSQL será
    // la protección adicional antes de salir a producción.
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        ${714215}::integer,
        ${canal.profesionalId}::integer
      )::text AS bloqueo
    `;

    const cliente = await tx.cliente.findFirst({
      where: {
        id: idCliente,
        organizacionId: canal.organizacionId,
        activo: true
      }
    });
    if (!cliente) {
      throw errorApi(404, 'CLIENTE_INVALIDO', 'Cliente no encontrado en esta organización');
    }

    const relacionServicio = await tx.profesionalServicio.findFirst({
      where: {
        profesionalId: canal.profesionalId,
        servicioId: idServicio,
        activo: true,
        servicio: {
          activo: true,
          organizacionId: canal.organizacionId
        }
      },
      include: { servicio: true }
    });
    if (!relacionServicio) {
      throw errorApi(404, 'SERVICIO_INVALIDO', 'Servicio no ofrecido por este profesional');
    }

    const ahora = new Date();
    // Expirar bloqueos antiguos antes de volver a ofrecer esos horarios.
    await tx.cita.updateMany({
      where: {
        profesionalId: canal.profesionalId,
        estado: 'RESERVA_TEMPORAL',
        fechaExpiracionReserva: { lte: ahora }
      },
      data: { estado: 'EXPIRADA' }
    });

    // Si el mismo cliente reintenta la petición, devolver la reserva
    // vigente que ya existe, sin crear otra fila innecesariamente.
    const anterior = await tx.cita.findFirst({
      where: {
        organizacionId: canal.organizacionId,
        profesionalId: canal.profesionalId,
        clienteId: idCliente,
        servicioId: idServicio,
        fechaInicio: fechaSolicitada.toUTC().toJSDate(),
        estado: { in: ['RESERVA_TEMPORAL', 'PENDIENTE_PAGO'] },
        fechaExpiracionReserva: { gt: ahora }
      }
    });
    if (anterior) {
      return respuestaReserva(
        anterior, canal, relacionServicio.servicio, zonaHoraria, false
      );
    }

    // Se consulta dentro de la transacción, DESPUÉS de obtener el
    // bloqueo, y usando el mismo cliente Prisma transaccional.
    const disponibilidad = await obtenerDisponibilidad({
      profesionalId: canal.profesionalId,
      servicioId: idServicio,
      desde: fechaLocal,
      dias: 1,
      db: tx
    });

    const horarios = disponibilidad.dias.flatMap((dia) => dia.horarios);
    const seleccionado = horarios.find((horario) => {
      const inicio = DateTime.fromISO(horario.fechaInicio, { setZone: true });
      return inicio.isValid && inicio.toMillis() === fechaSolicitada.toMillis();
    });

    if (!seleccionado) {
      throw errorApi(
        409,
        'HORARIO_NO_DISPONIBLE',
        'Ese horario ya no está disponible. Consulta otro horario.'
      );
    }

    const precio = relacionServicio.precioPersonalizado
      ?? relacionServicio.servicio.precio;
    const duracionMinutos = relacionServicio.duracionPersonalizadaMinutos
      ?? relacionServicio.servicio.duracionMinutos;

    const cita = await tx.cita.create({
      data: {
        organizacionId: canal.organizacionId,
        profesionalId: canal.profesionalId,
        clienteId: idCliente,
        servicioId: idServicio,
        fechaInicio: DateTime.fromISO(
          seleccionado.fechaInicio, { setZone: true }
        ).toUTC().toJSDate(),
        fechaFin: DateTime.fromISO(
          seleccionado.fechaFin, { setZone: true }
        ).toUTC().toJSDate(),
        precio,
        duracionMinutos,
        estado: 'RESERVA_TEMPORAL',
        fechaExpiracionReserva: new Date(Date.now() + MINUTOS_RESERVA * 60 * 1000)
      }
    });

    return respuestaReserva(
      cita, canal, relacionServicio.servicio, zonaHoraria, true
    );
  }, {
    maxWait: 10000,
    timeout: 20000
  });
}

module.exports = { crearReservaTemporal };
