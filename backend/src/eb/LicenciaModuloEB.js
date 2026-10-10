const { aNumero } = require('../utils/montos');

// Un módulo contratado suelto por la empresa, con el precio acordado al comprarlo.
class LicenciaModuloEB {
  constructor(licencia) {
    this.ModuloId = licencia.moduloId;
    this.Codigo = licencia.modulo.codigo;
    this.Nombre = licencia.modulo.nombre;
    this.Icono = licencia.modulo.icono || null;
    this.Precio = aNumero(licencia.precio);
    this.Moneda = licencia.moneda || null;
    this.Periodicidad = licencia.periodicidad || null;
    this.Activo = licencia.activo;
    this.FechaInicio = licencia.fechaInicio;
    this.FechaFin = licencia.fechaFin || null;
  }
}

module.exports = LicenciaModuloEB;
