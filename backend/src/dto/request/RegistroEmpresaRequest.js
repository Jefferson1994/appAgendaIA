const { IANAZone } = require('luxon');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto, validarIdPositivo } = require('../../utils/validaciones');
const { validarDatosPersona } = require('./RegistroUsuarioRequest');
const { validarPersonalEmpresa } = require('./CategoriasRequest');

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_RUC = /^\d{13}$/;
const LONGITUD_DESCRIPCION = 500;
const LONGITUD_UBICACION = 100;

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';

const textoOpcional = (valor, campo, maximo) => (vacio(valor) ? null : validarTexto(valor, campo, maximo));

function validarEmailOpcional(valor) {
  if (vacio(valor)) return null;
  const email = validarTexto(valor, 'organizacion.email', LONGITUD_MAX.TEXTO).toLowerCase();
  if (!FORMATO_EMAIL.test(email)) {
    throw new AppError(MSG.DATO_INVALIDO('organizacion.email'), HTTP.PETICION_INVALIDA);
  }
  return email;
}

function validarRucOpcional(valor) {
  if (vacio(valor)) return null;
  const ruc = validarTexto(valor, 'organizacion.ruc', LONGITUD_MAX.TEXTO);
  if (!FORMATO_RUC.test(ruc)) {
    throw new AppError(MSG.DATO_INVALIDO('organizacion.ruc'), HTTP.PETICION_INVALIDA);
  }
  return ruc;
}

function validarZonaHorariaOpcional(valor) {
  if (vacio(valor)) return null;
  const zona = validarTexto(valor, 'organizacion.zonaHoraria', LONGITUD_MAX.REFERENCIA);
  if (!IANAZone.isValidZone(zona)) {
    throw new AppError(MSG.DATO_INVALIDO('organizacion.zonaHoraria'), HTTP.PETICION_INVALIDA);
  }
  return zona;
}

const LIMITE_COORDENADA = { latitud: 90, longitud: 180 };
const DECIMALES_COORDENADA = 6;

function validarCoordenadaOpcional(valor, campo) {
  if (vacio(valor)) return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || Math.abs(numero) > LIMITE_COORDENADA[campo]) {
    throw new AppError(MSG.DATO_INVALIDO(`organizacion.${campo}`), HTTP.PETICION_INVALIDA);
  }
  return Number(numero.toFixed(DECIMALES_COORDENADA));
}

// Latitud y longitud van juntas: un punto con una sola coordenada no sirve.
function validarCoordenadas(datos) {
  const latitud = validarCoordenadaOpcional(datos.latitud, 'latitud');
  const longitud = validarCoordenadaOpcional(datos.longitud, 'longitud');
  if ((latitud === null) !== (longitud === null)) {
    throw new AppError(MSG.DATO_INVALIDO('organizacion.latitud'), HTTP.PETICION_INVALIDA);
  }
  return { latitud, longitud };
}

function validarOrganizacion(datos = {}) {
  return {
    // Tipo de negocio (subcategoría): define qué se reserva y los cargos del personal.
    categoriaId: validarIdPositivo(datos.categoriaId, 'organizacion.categoriaId'),
    nombre: validarTexto(datos.nombre, 'organizacion.nombre', LONGITUD_MAX.TEXTO),
    nombreComercial: textoOpcional(datos.nombreComercial, 'organizacion.nombreComercial', LONGITUD_MAX.TEXTO),
    ruc: validarRucOpcional(datos.ruc),
    descripcion: textoOpcional(datos.descripcion, 'organizacion.descripcion', LONGITUD_DESCRIPCION),
    telefono: textoOpcional(datos.telefono, 'organizacion.telefono', LONGITUD_MAX.TELEFONO),
    email: validarEmailOpcional(datos.email),
    provincia: textoOpcional(datos.provincia, 'organizacion.provincia', LONGITUD_UBICACION),
    ciudad: textoOpcional(datos.ciudad, 'organizacion.ciudad', LONGITUD_UBICACION),
    direccion: textoOpcional(datos.direccion, 'organizacion.direccion', LONGITUD_MAX.DIRECCION),
    zonaHoraria: validarZonaHorariaOpcional(datos.zonaHoraria),
    ...validarCoordenadas(datos)
  };
}

// POST /auth/registro-empresa. Dos bloques: la empresa y su administrador.
function validarRegistroEmpresa(body = {}) {
  return {
    organizacion: validarOrganizacion(body.organizacion),
    administrador: { ...validarDatosPersona(body.administrador), ...validarPersonalEmpresa(body.administrador) }
  };
}

module.exports = { validarRegistroEmpresa };