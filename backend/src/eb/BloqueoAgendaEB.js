const { DateTime } = require('luxon');

// Las horas vienen de columnas "time" de la base: se leen en UTC, sin conversión de zona.
const formatoHora = (hora) =>
  hora ? DateTime.fromJSDate(hora, { zone: 'utc' }).toFormat('HH:mm') : null;

// Un bloqueo de horario (almuerzo, vacaciones, reunión) que se muestra junto a las citas.
class BloqueoAgendaEB {
  constructor(bloqueo) {
    this.Id = bloqueo.id;
    this.Fecha = DateTime.fromJSDate(bloqueo.fecha, { zone: 'utc' }).toISODate();
    this.DiaCompleto = bloqueo.diaCompleto;
    this.HoraInicio = bloqueo.diaCompleto ? null : formatoHora(bloqueo.horaInicio);
    this.HoraFin = bloqueo.diaCompleto ? null : formatoHora(bloqueo.horaFin);
    this.Motivo = bloqueo.motivo || null;
    this.Profesional = {
      Id: bloqueo.profesional.id,
      Nombre: [bloqueo.profesional.nombre, bloqueo.profesional.apellido].filter(Boolean).join(' ')
    };
  }
}

module.exports = BloqueoAgendaEB;