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

const estaVacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';

// Texto opcional: vacío devuelve null; si viene, se valida como validarTexto.
function validarTextoOpcional(valor, campo, maximo = LONGITUD_MAX.TEXTO) {
  return estaVacio(valor) ? null : validarTexto(valor, campo, maximo);
}

// Texto que además debe cumplir un formato (expresión regular).
function validarFormato(valor, campo, formato, maximo = LONGITUD_MAX.TEXTO) {
  const texto = validarTexto(valor, campo, maximo);
  if (!formato.test(texto)) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// Entero dentro de un rango. Si no viene y hay valor por defecto, usa ese.
function validarEnteroEnRango(valor, campo, { min, max, defecto }) {
  if (estaVacio(valor) && defecto !== undefined) {
    return defecto;
  }
  const numero = Number(valor);
  if (estaVacio(valor) || !Number.isInteger(numero) || numero < min || numero > max) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return numero;
}

// Id opcional: vacío devuelve null (crear); si viene, debe ser un entero positivo (editar).
function validarIdOpcional(valor, campo) {
  return estaVacio(valor) ? null : validarIdPositivo(valor, campo);
}

// Importe con 2 decimales dentro de un rango (precios).
function validarImporte(valor, campo, { min, max }) {
  const numero = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  if (typeof numero !== 'number' || !Number.isFinite(numero) || numero < min || numero > max) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return Math.round(numero * 100) / 100;
}

// Valor que debe ser uno de una lista (ej. un enum de Prisma). Si no viene y hay defecto, usa ese.
function validarOpcion(valor, campo, opciones, defecto) {
  if (estaVacio(valor) && defecto !== undefined) {
    return defecto;
  }
  const texto = typeof valor === 'string' ? valor.trim().toUpperCase() : '';
  if (!opciones.includes(texto)) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// Lista de ids sin repetidos, con un máximo. `permitirVacia` = false exige al menos uno.
function validarListaIds(valor, campo, { maximo, permitirVacia = true }) {
  if (!Array.isArray(valor) || valor.length > maximo || (!permitirVacia && valor.length === 0)) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return [...new Set(valor.map((id) => validarIdPositivo(id, campo)))];
}

const FORMATO_CEDULA = /^\d{10}$/;
const PROVINCIAS_CEDULA = { MIN: 1, MAX: 24, EXTERIOR: 30 };

// Dígito verificador de la cédula ecuatoriana (módulo 10): provincia válida, tercer dígito
// menor a 6 y el último dígito calculado con los coeficientes 2,1,2,1...
function digitoCedulaCorrecto(cedula) {
  const provincia = Number(cedula.slice(0, 2));
  const provinciaValida =
    (provincia >= PROVINCIAS_CEDULA.MIN && provincia <= PROVINCIAS_CEDULA.MAX) || provincia === PROVINCIAS_CEDULA.EXTERIOR;
  if (!provinciaValida || Number(cedula[2]) >= 6) return false;

  const suma = cedula
    .slice(0, 9)
    .split('')
    .reduce((total, digito, indice) => {
      const producto = Number(digito) * (indice % 2 === 0 ? 2 : 1);
      return total + (producto > 9 ? producto - 9 : producto);
    }, 0);
  return (10 - (suma % 10)) % 10 === Number(cedula[9]);
}

// Siempre exige 10 dígitos. El dígito verificador se revisa salvo VALIDAR_DIGITO_CEDULA=false
// (solo en desarrollo, para probar con cédulas inventadas).
function esCedulaValida(cedula) {
  if (!FORMATO_CEDULA.test(cedula)) return false;
  return process.env.VALIDAR_DIGITO_CEDULA === 'false' || digitoCedulaCorrecto(cedula);
}

module.exports = {
  esCedulaValida,
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarTexto,
  validarTextoOpcional,
  validarFormato,
  validarEnteroEnRango,
  validarBooleano,
  validarImporte,
  validarOpcion,
  validarListaIds
};