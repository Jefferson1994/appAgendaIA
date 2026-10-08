const prisma = require('../shared/prisma');
const {ESTADOS_CITA,ESTADOS_CITA_BLOQUEANTES,ESTADOS_RESERVA_EXPIRABLES} = require('../config/constantes');

function listarBloqueantesEnRango(profesionalId, desde, hasta, db = prisma) {
  return db.cita.findMany({
    where: {
      profesionalId,
      fechaInicio: { lt: hasta },
      fechaFin: { gt: desde },
      estado: { in: ESTADOS_CITA_BLOQUEANTES }
    },
    select: {
      fechaInicio: true,
      fechaFin: true,
      estado: true,
      fechaExpiracionReserva: true
    }
  });
}

function buscarReservaVigente(
  { organizacionId, profesionalId, clienteId, servicioId, fechaInicio, ahora },
  db = prisma
) {
  return db.cita.findFirst({
    where: {
      organizacionId,
      profesionalId,
      clienteId,
      servicioId,
      fechaInicio,
      estado: { in: ESTADOS_RESERVA_EXPIRABLES },
      fechaExpiracionReserva: { gt: ahora }
    }
  });
}

function crearReservaTemporal(datos, db = prisma) {
  return db.cita.create({
    data: { ...datos, estado: ESTADOS_CITA.RESERVA_TEMPORAL }
  });
}

function buscarParaPago({ id, organizacionId, profesionalId }, db = prisma) {
  return db.cita.findFirst({
    where: { id, organizacionId, profesionalId },
    include: { servicio: true }
  });
}

function buscarPorId(id, db = prisma) {
  return db.cita.findUnique({ where: { id } });
}

function buscarUltimaPorTelefono({ organizacionId, profesionalId, telefono }, db = prisma) {
  return db.cita.findFirst({
    where: {
      organizacionId,
      profesionalId,
      cliente: { telefono, activo: true }
    },
    orderBy: { fechaCreacion: 'desc' }
  });
}

function actualizar(id, datos, db = prisma) {
  return db.cita.update({ where: { id }, data: datos });
}

// Citas de una empresa en un rango, para la pantalla de agenda.
// Una reserva temporal o pendiente cuyo plazo ya venció no se muestra, aunque la limpieza automática
// todavía no la haya marcado como expirada.
function listarAgenda({ organizacionId, profesionalId, desde, hasta, estados, ahora }, db = prisma) {
  return db.cita.findMany({
    where: {
      organizacionId,
      ...(profesionalId ? { profesionalId } : {}),
      fechaInicio: { gte: desde, lt: hasta },
      estado: { in: estados },
      OR: [
        { estado: { notIn: ESTADOS_RESERVA_EXPIRABLES } },
        { fechaExpiracionReserva: { gt: ahora } }
      ]
    },
    include: { cliente: true, servicio: true, profesional: true },
    orderBy: { fechaInicio: 'asc' }
  });
}

module.exports = {
  listarBloqueantesEnRango,
  buscarReservaVigente,
  crearReservaTemporal,
  buscarParaPago,
  buscarPorId,
  buscarUltimaPorTelefono,
  listarAgenda,
  actualizar
};
