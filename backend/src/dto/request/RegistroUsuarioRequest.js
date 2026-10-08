const { TipoIdentificacion } = require('@prisma/client');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, AUTH, LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto } = require('../../utils/validaciones');

const CLAVE_MAX = 200;
const IDENTIFICACION_MAX = 20;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_CEDULA = /^\d{10}$/;
const TIPOS_IDENTIFICACION = Object.values(TipoIdentificacion);

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';

function validarEmail(valor) {
  const email = validarTexto(valor, 'email', LONGITUD_MAX.TEXTO).toLowerCase();
  if (!FORMATO_EMAIL.test(email)) {
    throw new AppError(MSG.DATO_INVALIDO('email'), HTTP.PETICION_INVALIDA);
  }
  return email;
}

function validarClaveNueva(valor) {
  const clave = validarTexto(valor, 'password', CLAVE_MAX);
  if (clave.length < AUTH.CLAVE_MIN_LARGO) {
    throw new AppError(MSG.CLAVE_DEBIL, HTTP.PETICION_INVALIDA);
  }
  return clave;
}

// La identificación es opcional, pero si viene debe traer su tipo y un formato válido.
function validarIdentificacion(tipo, identificacion) {
  if (vacio(tipo) && vacio(identificacion)) {
    return { tipoIdentificacion: null, identificacion: null };
  }

  const tipoIdentificacion = validarTexto(tipo, 'tipoIdentificacion').toUpperCase();
  if (!TIPOS_IDENTIFICACION.includes(tipoIdentificacion)) {
    throw new AppError(MSG.DATO_INVALIDO('tipoIdentificacion'), HTTP.PETICION_INVALIDA);
  }

  const numero = validarTexto(identificacion, 'identificacion', IDENTIFICACION_MAX);
  if (tipoIdentificacion === TipoIdentificacion.CEDULA && !FORMATO_CEDULA.test(numero)) {
    throw new AppError(MSG.DATO_INVALIDO('identificacion'), HTTP.PETICION_INVALIDA);
  }

  return { tipoIdentificacion, identificacion: numero };
}

// Datos de la persona que se registra (el administrador de la empresa).
function validarDatosPersona(body = {}) {
  const email = validarEmail(body.email);

  return {
    email,
    password: validarClaveNueva(body.password),
    ...validarIdentificacion(body.tipoIdentificacion, body.identificacion),
    nombres: vacio(body.nombres)
      ? email.split('@')[0].slice(0, LONGITUD_MAX.NOMBRE)
      : validarTexto(body.nombres, 'nombres', LONGITUD_MAX.NOMBRE),
    apellidos: vacio(body.apellidos) ? null : validarTexto(body.apellidos, 'apellidos', LONGITUD_MAX.NOMBRE),
    telefono: vacio(body.telefono) ? null : validarTexto(body.telefono, 'telefono', LONGITUD_MAX.TELEFONO)
  };
}

module.exports = { validarDatosPersona };