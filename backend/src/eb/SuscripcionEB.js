const { aNumero } = require('../utils/montos');

// Una suscripción del historial, con el precio que se cobró en ese momento.
class SuscripcionEB {
  constructor(suscripcion) {
    this.Id = suscripcion.id;
    this.Plan = {
      Id: suscripcion.plan.id,
      Codigo: suscripcion.plan.codigo,
      Nombre: suscripcion.plan.nombre
    };
    this.Precio = aNumero(suscripcion.precio);
    this.Moneda = suscripcion.moneda;
    this.Periodicidad = suscripcion.periodicidad;
    this.Estado = suscripcion.estado;
    this.FechaInicio = suscripcion.fechaInicio;
    this.FechaFin = suscripcion.fechaFin || null;
    this.ProveedorPago = suscripcion.proveedorPago || null;
    this.FechaPago = suscripcion.fechaPago || null;
  }
}

module.exports = SuscripcionEB;
