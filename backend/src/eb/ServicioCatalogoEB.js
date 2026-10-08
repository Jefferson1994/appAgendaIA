const { nombreCompleto } = require('../utils/texto');

const aNumero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

// Un servicio del catálogo de la empresa, con los profesionales que lo ofrecen.
// `Precio` de cada profesional es el que realmente cobra: su precio propio o, si no tiene, el del servicio.
class ServicioCatalogoEB {
  constructor(servicio) {
    this.Id = servicio.id;
    this.Codigo = servicio.codigo;
    this.Nombre = servicio.nombre;
    this.Descripcion = servicio.descripcion || null;
    this.Precio = aNumero(servicio.precio);
    this.DuracionMinutos = servicio.duracionMinutos;
    this.RequierePagoPrevio = servicio.requierePagoPrevio;
    this.PorcentajeAnticipo = aNumero(servicio.porcentajeAnticipo);
    this.Activo = servicio.activo;

    this.Profesionales = servicio.profesionales.map((asignacion) => ({
      Id: asignacion.profesional.id,
      Nombre: nombreCompleto(asignacion.profesional),
      Precio: aNumero(asignacion.precioPersonalizado ?? servicio.precio),
      PrecioPropio: aNumero(asignacion.precioPersonalizado),
      DuracionMinutos: asignacion.duracionPersonalizadaMinutos ?? servicio.duracionMinutos
    }));
  }
}

module.exports = ServicioCatalogoEB;