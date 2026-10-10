// Un módulo del menú con sus pantallas.
// `Acciones`: códigos de permiso concedidos en la pantalla (para revisar permisos).
// `Botones`: los botones del catálogo concedidos, con su nombre e ícono (para pintar la botonera).
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
      Acciones: pantalla.acciones,
      Botones: (pantalla.botones || []).map(({ permiso, accion }) => ({
        Permiso: permiso,
        Accion: accion.codigo,
        Nombre: accion.nombre,
        Icono: accion.icono || null,
        RequiereSeleccion: accion.requiereSeleccion
      }))
    }));
  }
}

module.exports = MenuModuloEB;
