const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX, PORCENTAJE_ANTICIPO_COMPLETO } = require('../../config/constantes');
const { validarTexto, validarIdPositivo, validarIdOpcional, validarBooleano, validarListaIds } = require('../../utils/validaciones');

const DESCRIPCION_MAX = 1000;
const PRECIO_MAX = 99999999.99;
const DURACION_MIN = 5;
const DURACION_MAX = 1440;
const ASIGNACIONES_MAX = 100;
// Tope del body: el servicio aplica el máximo real de fotos (SERVICIOS.FOTOS_MAX) con su mensaje.
const FOTOS_LISTA_MAX = 10;

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';
const invalido = (campo) => new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);

function validarNumero(valor, campo, { min, max, entero = false }) {
  const numero = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;

  if (typeof numero !== 'number' || !Number.isFinite(numero) || numero < min || numero > max) {
    throw invalido(campo);
  }
  if (entero && !Number.isInteger(numero)) {
    throw invalido(campo);
  }
  return entero ? numero : Math.round(numero * 100) / 100;
}

const validarPrecio = (valor, campo) => validarNumero(valor, campo, { min: 0, max: PRECIO_MAX });
const validarDuracion = (valor, campo) =>
  validarNumero(valor, campo, { min: DURACION_MIN, max: DURACION_MAX, entero: true });

// Profesionales que ofrecen el servicio, cada uno con su precio y duración propios (opcionales).
// Si no viene, la edición no cambia las asignaciones.
function validarAsignaciones(lista) {
  if (lista === undefined || lista === null) {
    return null;
  }
  if (!Array.isArray(lista) || lista.length > ASIGNACIONES_MAX) {
    throw invalido('profesionales');
  }

  const vistos = new Set();

  return lista.map((item = {}) => {
    const profesionalId = validarIdPositivo(item && item.profesionalId, 'profesionalId');
    if (vistos.has(profesionalId)) {
      throw invalido('profesionales');
    }
    vistos.add(profesionalId);

    return {
      profesionalId,
      precioPersonalizado: vacio(item.precio) ? null : validarPrecio(item.precio, 'profesionales.precio'),
      duracionPersonalizadaMinutos: vacio(item.duracionMinutos)
        ? null
        : validarDuracion(item.duracionMinutos, 'profesionales.duracionMinutos')
    };
  });
}

// POST /servicios/guardar. Con servicioId edita; sin él, crea.
// La empresa sale del usuario autenticado; solo el super admin la elige con organizacionId.
// `fotoIds`: lista completa de fotos en orden; si no viene, no se cambian.
function validarGuardarServicio(body = {}) {
  const requierePagoPrevio = validarBooleano(body.requierePagoPrevio, 'requierePagoPrevio', false);

  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    servicioId: vacio(body.servicioId) ? null : validarIdPositivo(body.servicioId, 'servicioId'),
    nombre: validarTexto(body.nombre, 'nombre', LONGITUD_MAX.TEXTO),
    descripcion: vacio(body.descripcion) ? null : validarTexto(body.descripcion, 'descripcion', DESCRIPCION_MAX),
    precio: validarPrecio(body.precio, 'precio'),
    duracionMinutos: validarDuracion(body.duracionMinutos, 'duracionMinutos'),
    requierePagoPrevio,
    porcentajeAnticipo: !requierePagoPrevio
      ? null
      : vacio(body.porcentajeAnticipo)
        ? PORCENTAJE_ANTICIPO_COMPLETO
        : validarNumero(body.porcentajeAnticipo, 'porcentajeAnticipo', { min: 1, max: 100 }),
    profesionales: validarAsignaciones(body.profesionales),
    todosLosProfesionales: validarBooleano(body.todosLosProfesionales, 'todosLosProfesionales', false),
    fotoIds: body.fotoIds === undefined || body.fotoIds === null
      ? null
      : validarListaIds(body.fotoIds, 'fotoIds', { maximo: FOTOS_LISTA_MAX })
  };
}

module.exports = { validarGuardarServicio };