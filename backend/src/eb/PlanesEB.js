const PlanEB = require('./PlanEB');
const ModuloVentaEB = require('./ModuloVentaEB');

// Respuesta de POST /planes/consultar: los planes y los módulos que se pueden vender.
class PlanesEB {
  constructor({ planes, modulos }) {
    this.Planes = planes.map((plan) => new PlanEB(plan));
    this.Modulos = modulos.map((modulo) => new ModuloVentaEB(modulo));
  }
}

module.exports = PlanesEB;
