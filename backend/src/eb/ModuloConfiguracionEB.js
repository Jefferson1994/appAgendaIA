const PantallaConfiguracionEB = require('./PantallaConfiguracionEB');

// Un módulo con sus pantallas y botones, incluidos los inactivos.
class ModuloConfiguracionEB {
  constructor(modulo) {
    this.Id = modulo.id;
    this.Codigo = modulo.codigo;
    this.Nombre = modulo.nombre;
    this.Descripcion = modulo.descripcion || null;
    this.Icono = modulo.icono || null;
    this.Orden = modulo.orden;
    this.EsBase = modulo.esBase;
    this.Activo = modulo.activo;
    this.Pantallas = (modulo.pantallas || []).map((pantalla) => new PantallaConfiguracionEB(pantalla));
  }
}

module.exports = ModuloConfiguracionEB;
