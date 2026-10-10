const CategoriaEB = require('./CategoriaEB');
const CargoEB = require('./CargoEB');

// Respuesta de POST /categorias/consultar (super admin): todas las categorías y todos los cargos.
class CategoriasEB {
  constructor({ categorias, cargos }) {
    this.Categorias = categorias.map((categoria) => new CategoriaEB(categoria));
    this.Cargos = cargos.map((cargo) => new CargoEB(cargo));
  }
}

module.exports = CategoriasEB;
