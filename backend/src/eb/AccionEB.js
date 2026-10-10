// Una acción del catálogo de botones (Ver, Crear, Editar...).
class AccionEB {
  constructor(accion) {
    this.Id = accion.id;
    this.Codigo = accion.codigo;
    this.Nombre = accion.nombre;
    this.Icono = accion.icono || null;
    this.Orden = accion.orden;
    this.RequiereSeleccion = accion.requiereSeleccion;
  }
}

module.exports = AccionEB;
