const { DateTime } = require('luxon');
const { nombreCompleto } = require('../utils/texto');

// Forma de la reserva hacia afuera. Mantiene los nombres de campo que ya lee n8n.
class ReservaEB {
  constructor({ cita, profesional, servicio, zonaHoraria, creada }) {
    const inicio = DateTime.fromJSDate(cita.fechaInicio).setZone(zonaHoraria);
    const fin = DateTime.fromJSDate(cita.fechaFin).setZone(zonaHoraria);

    this.creada = creada;
    this.reserva = {
      id: cita.id,
      estado: cita.estado,
      profesional: { id: profesional.id, nombre: nombreCompleto(profesional) },
      servicio: { id: servicio.id, nombre: servicio.nombre },
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
    };
  }
}

module.exports = ReservaEB;