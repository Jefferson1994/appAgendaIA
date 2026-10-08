const { DateTime } = require('luxon');

const nombreCompleto = (persona) =>
  [persona.nombre, persona.apellido].filter(Boolean).join(' ');

// Una cita en la agenda. Las horas se entregan en la zona horaria de la empresa.
class CitaAgendaEB {
  constructor(cita, zona) {
    const inicio = DateTime.fromJSDate(cita.fechaInicio, { zone: zona });
    const fin = DateTime.fromJSDate(cita.fechaFin, { zone: zona });

    this.Id = cita.id;
    this.Fecha = inicio.toISODate();
    this.HoraInicio = inicio.toFormat('HH:mm');
    this.HoraFin = fin.toFormat('HH:mm');
    this.DuracionMinutos = cita.duracionMinutos;
    this.Estado = cita.estado;
    this.Precio = cita.precio;
    this.Notas = cita.notasCliente || null;

    this.Cliente = {
      Id: cita.cliente.id,
      Nombre: nombreCompleto(cita.cliente),
      Telefono: cita.cliente.telefono
    };
    this.Servicio = { Id: cita.servicio.id, Nombre: cita.servicio.nombre };
    this.Profesional = { Id: cita.profesional.id, Nombre: nombreCompleto(cita.profesional) };
  }
}

module.exports = CitaAgendaEB;