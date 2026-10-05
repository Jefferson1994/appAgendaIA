const { validarIdPositivo } = require('../../utils/validaciones');

function normalizarTexto(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor).trim();
  return texto || null;
}

// GET /servicios?profesionalId=1&texto=consulta
function validarListar(query = {}) {
  return {
    profesionalId: validarIdPositivo(query.profesionalId, 'profesionalId'),
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