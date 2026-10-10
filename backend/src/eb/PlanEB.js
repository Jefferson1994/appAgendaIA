const { aNumero } = require('../utils/montos');

// Un plan con su precio y sus módulos. `EsVigente` lo marca la pantalla de la empresa.
class PlanEB {
  constructor(plan, { esVigente = false } = {}) {
    this.Id = plan.id;
    this.Codigo = plan.codigo;
    this.Nombre = plan.nombre;
    this.Descripcion = plan.descripcion || null;
    this.Precio = aNumero(plan.precio);
    this.Moneda = plan.moneda;
    this.Periodicidad = plan.periodicidad;
    this.Orden = plan.orden;
    this.Activo = plan.activo;
    this.EsVigente = esVigente;
    this.Modulos = (plan.modulos || [])
      .map((planModulo) => planModulo.modulo)
      .sort((a, b) => a.orden - b.orden)
      .map((modulo) => ({ Id: modulo.id, Codigo: modulo.codigo, Nombre: modulo.nombre, Icono: modulo.icono || null }));
  }
}

module.exports = PlanEB;
