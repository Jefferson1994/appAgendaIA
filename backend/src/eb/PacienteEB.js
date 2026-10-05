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