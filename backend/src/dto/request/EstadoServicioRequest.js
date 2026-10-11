const { validarIdPositivo, validarIdOpcional, validarBooleano } = require('../../utils/validaciones');

// POST /servicios/estado. Activa o desactiva un servicio.
function validarEstadoServicio(body = {}) {
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    servicioId: validarIdPositivo(body.servicioId, 'servicioId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

module.exports = { validarEstadoServicio };