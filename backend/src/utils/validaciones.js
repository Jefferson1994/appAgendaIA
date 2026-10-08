const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../config/constantes');

function validarIdPositivo(valor, campo) {
  const numero = Number(valor);
  const vacio = valor === null || valor === undefined || String(valor).trim() === '';

  if (vacio || !Number.isSafeInteger(numero) || numero <= 0) {
    throw new AppError(MSG.ID_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return numero;
}

function validarTexto(valor, campo, maximo = LONGITUD_MAX.TEXTO) {
  const texto = typeof valor === 'string' ? valor.trim() : '';

  if (!texto || texto.length > maximo) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// Acepta solo true o false. Si no viene y hay valor por defecto, usa ese.
function validarBooleano(valor, campo, defecto) {
  if ((valor === undefined || valor === null) && defecto !== undefined) {
    return defecto;
  }
  if (typeof valor !== 'boolean') {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return valor;
}

module.exports = { validarIdPositivo, validarTexto, validarBooleano };