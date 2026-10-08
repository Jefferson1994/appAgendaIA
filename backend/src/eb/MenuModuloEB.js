// Un módulo del menú con sus pantallas y los botones (códigos de permiso) permitidos en cada una.
class MenuModuloEB {
  constructor(modulo) {
    this.Codigo = modulo.codigo;
    this.Nombre = modulo.nombre;
    this.Icono = modulo.icono || null;
    this.Orden = modulo.orden;
    this.Pantallas = modulo.pantallas.map((pantalla) => ({
      Codigo: pantalla.codigo,
      Nombre: pantalla.nombre,
      Ruta: pantalla.ruta,
      Icono: pantalla.icono || null,
      Orden: pantalla.orden,
      Acciones: pantalla.acciones
    }));
  }
}

module.exports = MenuModuloEB;