const { validarIdPositivo, validarTexto } = require('../../utils/validaciones');

// POST /pagos/solicitar
function validarSolicitud(body = {}) {
  return {
    canalId: validarTexto(body.canal_id, 'canal_id'),
    citaId: validarIdPositivo(body.cita_id, 'cita_id')
  };
}

module.exports = { validarSolicitud };