const { validarIdPositivo, validarTexto, validarOpcion } = require('../../utils/validaciones');
const { METODO_PAGO } = require('../../config/constantes');

function validarSolicitud(body = {}) {
  return {
    canalId: validarTexto(body.canal_id, 'canal_id'),
    citaId: validarIdPositivo(body.cita_id, 'cita_id'),
    metodo: body.metodo === undefined || body.metodo === null || body.metodo === ''
      ? METODO_PAGO.PASARELA
      : validarOpcion(body.metodo, 'metodo', Object.values(METODO_PAGO))
  };
}

module.exports = { validarSolicitud };
