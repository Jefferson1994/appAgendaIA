// Forma del paciente hacia afuera. Mantiene el formato que ya consume n8n.
class PacienteEB {
  constructor(cliente) {
    this.Id = cliente.id;
    this.OrganizacionId = cliente.organizacionId;
    this.Nombre = cliente.nombre;
    this.Telefono = cliente.telefono;
    this.Direccion = cliente.direccion || 'N/D';
    this.Fecha = cliente.fechaCreacion;
  }
}

module.exports = PacienteEB;