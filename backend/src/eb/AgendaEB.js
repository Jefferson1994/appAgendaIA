const CitaAgendaEB = require('./CitaAgendaEB');
const BloqueoAgendaEB = require('./BloqueoAgendaEB');

// Respuesta completa de la pantalla de agenda: citas, bloqueos y resumen del rango.
class AgendaEB {
  constructor({ citas, bloqueos, resumen, desde, hasta, zona }) {
    this.Desde = desde;
    this.Hasta = hasta;
    this.ZonaHoraria = zona;

    this.Citas = citas.map((cita) => new CitaAgendaEB(cita, zona));
    this.Bloqueos = bloqueos.map((bloqueo) => new BloqueoAgendaEB(bloqueo));

    this.Resumen = {
      Total: resumen.total,
      Confirmadas: resumen.confirmadas,
      Pendientes: resumen.pendientes,
      Atendidas: resumen.atendidas
    };
  }
}

module.exports = AgendaEB;