// Un valor de catálogo (Banco Pichincha, Ahorros, QR de cobro...).
const aItem = (item) => ({
  Id: item.id,
  CatalogoId: item.catalogoId,
  Codigo: item.codigo,
  Nombre: item.nombre,
  Descripcion: item.descripcion || null,
  Orden: item.orden,
  Activo: item.activo
});

// Respuesta de POST /catalogos/consultar (super admin): los catálogos con todos sus valores.
class CatalogosEB {
  constructor(catalogos) {
    this.Catalogos = catalogos.map((catalogo) => ({
      Id: catalogo.id,
      Codigo: catalogo.codigo,
      Nombre: catalogo.nombre,
      Descripcion: catalogo.descripcion || null,
      Items: catalogo.items.map(aItem)
    }));
  }
}

module.exports = { CatalogosEB, aItem };
