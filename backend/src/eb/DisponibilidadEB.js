const { nombreCompleto } = require('../utils/texto');

// Forma de la disponibilidad hacia afuera. Mantiene los nombres de campo que ya lee n8n.
class DisponibilidadEB {
  constructor({ profesional, servicio, precio, duracionMinutos, zonaHoraria, dias }) {
    this.profesional = {
      id: profesional.id,
      nombre: nombreCompleto(profesional),
      intervalo_agenda_minutos: profesional.intervaloAgendaMinutos
    };

    this.servicio = {
      id: servicio.id,
      nombre: servicio.nombre,
      precio,
      duracion_min: duracionMinutos
    };

    this.zona_horaria = zonaHoraria;
    this.dias = dias;
  }
}

module.exports = DisponibilidadEB;