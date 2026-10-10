const { aNumero } = require('../utils/montos');

// Un módulo con su precio de venta suelto. `SeVende` = tiene precio y se puede comprar aparte.
// `Activo` = false: no se puede agregar a planes nuevos ni venderse hasta que se reactive.
class ModuloVentaEB {
  constructor(modulo) {
    this.Id = modulo.id;
    this.Codigo = modulo.codigo;
    this.Nombre = modulo.nombre;
    this.Descripcion = modulo.descripcion || null;
    this.Icono = modulo.icono || null;
    this.Activo = modulo.activo;
    this.Precio = aNumero(modulo.precio);
    this.Moneda = modulo.moneda;
    this.Periodicidad = modulo.periodicidad;
    this.SeVende = modulo.precio !== null && modulo.precio !== undefined;
  }
}

module.exports = ModuloVentaEB;
