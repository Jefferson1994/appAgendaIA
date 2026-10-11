const { nombreCompleto } = require('../utils/texto');

// `rutaFoto(documentoId)`: solo en el contexto del canal; agrega `fotos` con la URL de cada una
// (el bot las descarga para mandarlas por WhatsApp). Sin ella, el campo no viaja.
class ServicioEB {
  constructor(relacion, profesional, rutaFoto = null) {
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
    if (rutaFoto) this.fotos = (servicio.fotos || []).map((foto) => rutaFoto(foto.documentoId));
  }
}

module.exports = ServicioEB;