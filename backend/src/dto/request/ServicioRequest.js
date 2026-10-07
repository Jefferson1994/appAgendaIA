const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP } = require('../../config/constantes');
const { validarIdPositivo } = require('../../utils/validaciones');

function normalizarTexto(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor).trim();
  return texto || null;
}

function normalizarCanalId(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return null;
  }

  const canalId = String(valor).trim();
  if (canalId.length > 100) {
    throw new AppError('canal_id no es válido', HTTP.PETICION_INVALIDA);
  }

  return canalId;
}

// GET /servicios?profesionalId=1&texto=consulta
// GET /servicios?canal_id=wa-ana-demo&texto=consulta
function validarListar(query = {}) {
  const canalId = normalizarCanalId(query.canal_id);

  if (canalId) {
    return {
      profesionalId: null,
      canalId,
      texto: normalizarTexto(query.texto)
    };
  }

  return {
    profesionalId: validarIdPositivo(query.profesionalId, 'profesionalId'),
    canalId: null,
    texto: normalizarTexto(query.texto)
  };
}

// GET /servicios/:id?profesionalId=1
function validarPorId(params = {}, query = {}) {
  return {
    profesionalId: validarIdPositivo(query.profesionalId, 'profesionalId'),
    servicioId: validarIdPositivo(params.id, 'servicioId')
  };
}

module.exports = { validarListar, validarPorId };
