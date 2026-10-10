// Respuesta pública de POST /categorias/publicas para el registro de empresa:
// categorías generales con sus subcategorías. Cada subcategoría trae lo que se reserva
// y sus cargos (los propios más los de su categoría general).
const aCargo = (cargo) => ({ Id: cargo.id, Nombre: cargo.nombre });

class CatalogoNegociosEB {
  constructor(categorias) {
    this.Categorias = categorias
      .filter((categoria) => categoria.subcategorias.length > 0)
      .map((categoria) => ({
        Id: categoria.id,
        Nombre: categoria.nombre,
        Descripcion: categoria.descripcion || null,
        Icono: categoria.icono || null,
        Subcategorias: categoria.subcategorias.map((subcategoria) => ({
          Id: subcategoria.id,
          Nombre: subcategoria.nombre,
          Descripcion: subcategoria.descripcion || null,
          Icono: subcategoria.icono || categoria.icono || null,
          Reserva: subcategoria.reserva,
          Cargos: [...subcategoria.cargos, ...categoria.cargos].map(aCargo)
        }))
      }));
  }
}

module.exports = CatalogoNegociosEB;
