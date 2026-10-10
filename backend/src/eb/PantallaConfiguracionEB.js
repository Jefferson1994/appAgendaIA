const BotonConfiguracionEB = require('./BotonConfiguracionEB');

// Una pantalla de un módulo con sus botones, tal como la edita la configuración.
class PantallaConfiguracionEB {
  constructor(pantalla) {
    this.Id = pantalla.id;
    this.ModuloId = pantalla.moduloId;
    this.Codigo = pantalla.codigo;
    this.Nombre = pantalla.nombre;
    this.Ruta = pantalla.ruta;
    this.Icono = pantalla.icono || null;
    this.Orden = pantalla.orden;
    this.Activo = pantalla.activo;
    this.SoloPlataforma = pantalla.soloPlataforma;
    this.Botones = (pantalla.permisos || []).map((permiso) => new BotonConfiguracionEB(permiso));
  }
}

module.exports = PantallaConfiguracionEB;
