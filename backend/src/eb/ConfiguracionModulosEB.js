const ModuloConfiguracionEB = require('./ModuloConfiguracionEB');
const AccionEB = require('./AccionEB');

// Respuesta de POST /configuracion-modulos/consultar: el árbol completo
// y el catálogo de acciones que se pueden asignar a las pantallas.
class ConfiguracionModulosEB {
  constructor({ modulos, acciones }) {
    this.Modulos = modulos.map((modulo) => new ModuloConfiguracionEB(modulo));
    this.Acciones = acciones.map((accion) => new AccionEB(accion));
  }
}

module.exports = ConfiguracionModulosEB;
