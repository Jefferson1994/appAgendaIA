const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../../config/constantes');
const { validarIdPositivo, validarTexto } = require('../../utils/validaciones');

const aTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

function normalizarDireccion(valor) {
  const texto = aTexto(valor).trim();
  if (!texto || texto === 'N/D') return null;
  if (texto.length > LONGITUD_MAX.DIRECCION) {
    throw new AppError(MSG.DATO_INVALIDO('direccion'), HTTP.PETICION_INVALIDA);
  }
  return texto;
}

function validarListar(query = {}) {
  return { organizacionId: validarIdPositivo(query.organizacionId, 'organizacionId') };
}

function validarRegistro(body = {}) {
  return {
    organizacionId: validarIdPositivo(body.organizacionId, 'organizacionId'),
    nombre: validarTexto(aTexto(body.nombre), 'nombre', LONGITUD_MAX.NOMBRE),
    telefono: validarTexto(aTexto(body.telefono), 'telefono', LONGITUD_MAX.TELEFONO),
    direccion: normalizarDireccion(body.direccion)
  };
}

module.exports = { validarListar, validarRegistro };