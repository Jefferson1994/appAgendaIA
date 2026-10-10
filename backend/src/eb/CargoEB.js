// Cargo del catálogo (Odontólogo, Recepcionista, Mesero) tal como lo ve el super admin.
class CargoEB {
  constructor(cargo) {
    this.Id = cargo.id;
    this.CategoriaId = cargo.categoriaId;
    this.Codigo = cargo.codigo;
    this.Nombre = cargo.nombre;
    this.Descripcion = cargo.descripcion || null;
    this.Orden = cargo.orden;
    this.Activo = cargo.activo;
    this.Usuarios = cargo._count ? cargo._count.usuarios : 0;
  }
}

module.exports = CargoEB;
