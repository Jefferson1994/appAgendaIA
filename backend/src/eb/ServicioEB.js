const { nombreCompleto } = require('../utils/texto');

class ServicioEB {
  constructor(relacion, profesional) {
    const servicio = relacion.servicio;

    this.id = servicio.id;
    this.codigo = servicio.codigo;
    this.nombre = servicio.nombre;
    this.descripcion = servicio.descripcion;
    this.precio = Number(relacion.precioPersonalizado ?? servicio.precio);
    this.duracion_min = relacion.duracionPersonalizadaMinutos ?? servicio.duracionMinutos;
    this.requiere_pago_previo = servicio.requierePagoPrevio;
    this.porcentaje_anticipo = servicio.porcentajeAnticipo ? Number(servicio.porcentajeAnticipo) : null;
    this.profesional = { id: profesional.id, nombre: nombreCompleto(profesional) };
  }
}

module.exports = ServicioEB;