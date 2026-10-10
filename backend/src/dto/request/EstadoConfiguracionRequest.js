const { validarIdPositivo, validarBooleano } = require('../../utils/validaciones');

// POST /configuracion-modulos/modulos/estado
function validarEstadoModulo(body = {}) {
  return {
    moduloId: validarIdPositivo(body.moduloId, 'moduloId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

// POST /configuracion-modulos/pantallas/estado
function validarEstadoPantalla(body = {}) {
  return {
    pantallaId: validarIdPositivo(body.pantallaId, 'pantallaId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

// POST /configuracion-modulos/botones/eliminar
function validarEliminarBoton(body = {}) {
  return { botonId: validarIdPositivo(body.botonId, 'botonId') };
}

module.exports = { validarEstadoModulo, validarEstadoPantalla, validarEliminarBoton };
