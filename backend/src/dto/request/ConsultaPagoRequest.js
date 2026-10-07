const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../../config/constantes');
const { validarIdPositivo, validarTexto } = require('../../utils/validaciones');

// GET /pagos/estado?canal_id=...&cita_id=...
function validarConsulta(query = {}) {
  const canalId = validarTexto(query.canal_id, 'canal_id');

  if (query.cita_id !== undefined && String(query.cita_id).trim() !== '') {
    return { canalId, citaId: validarIdPositivo(query.cita_id, 'cita_id') };
  }

  if (query.telefono !== undefined && String(query.telefono).trim() !== '') {
    return { canalId, telefono: validarTexto(query.telefono, 'telefono', LONGITUD_MAX.TELEFONO) };
  }

  throw new AppError(MSG.CAMPO_OBLIGATORIO('cita_id o telefono'), HTTP.PETICION_INVALIDA);
}

module.exports = { validarConsulta };
