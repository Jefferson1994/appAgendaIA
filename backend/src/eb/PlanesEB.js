const PlanEB = require('./PlanEB');
const ModuloVentaEB = require('./ModuloVentaEB');

// Respuesta de POST /planes/consultar: los planes, los módulos que se pueden vender y los
// tipos de negocio a los que se puede ofrecer un plan (generales y subcategorías).
class PlanesEB {
  constructor({ planes, modulos, categorias }) {
    this.Planes = planes.map((plan) => new PlanEB(plan));
    this.Modulos = modulos.map((modulo) => new ModuloVentaEB(modulo));
    this.Categorias = categorias.map((categoria) => ({
      Id: categoria.id,
      PadreId: categoria.padreId,
      Nombre: categoria.nombre,
      Activo: categoria.activo
    }));
  }
}

module.exports = PlanesEB;
