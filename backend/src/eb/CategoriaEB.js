// Categoría de negocio tal como la ve el super admin.
// `PadreId` null = categoría general (Salud); con valor = subcategoría (Odontología).
class CategoriaEB {
  constructor(categoria) {
    this.Id = categoria.id;
    this.PadreId = categoria.padreId;
    this.Codigo = categoria.codigo;
    this.Nombre = categoria.nombre;
    this.Descripcion = categoria.descripcion || null;
    this.Icono = categoria.icono || null;
    this.Reserva = categoria.reserva;
    this.Orden = categoria.orden;
    this.Activo = categoria.activo;
    this.Empresas = categoria._count ? categoria._count.organizaciones : 0;
  }
}

module.exports = CategoriaEB;
