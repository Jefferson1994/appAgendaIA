const {
  FORMATOS_ACCESO,
  ORDEN_ACCESO,
  VENTA,
  PERIODICIDADES,
  MONEDA_DEFECTO
} = require('../../config/constantes');
const {
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarFormato,
  validarTexto,
  validarTextoOpcional,
  validarEnteroEnRango,
  validarBooleano,
  validarImporte,
  validarOpcion,
  validarListaIds
} = require('../../utils/validaciones');

const RANGO_PRECIO = { min: VENTA.PRECIO_MIN, max: VENTA.PRECIO_MAX };
const RANGO_ORDEN = { min: ORDEN_ACCESO.MIN, max: ORDEN_ACCESO.MAX, defecto: ORDEN_ACCESO.MIN };
const OPCIONES_PERIODICIDAD = Object.values(PERIODICIDADES);

const validarMoneda = (valor) =>
  estaVacio(valor) ? MONEDA_DEFECTO : validarFormato(String(valor).toUpperCase(), 'moneda', VENTA.FORMATO_MONEDA, 3);

const validarPeriodicidad = (valor) =>
  validarOpcion(valor, 'periodicidad', OPCIONES_PERIODICIDAD, PERIODICIDADES.MENSUAL);

// POST /planes/guardar. Con planId edita; sin él, crea. El código solo se fija al crear.
// `moduloIds` es la lista completa de módulos del plan (reemplaza la anterior).
function validarGuardarPlan(body = {}) {
  const planId = validarIdOpcional(body.planId, 'planId');

  return {
    planId,
    codigo: planId
      ? null
      : validarFormato(body.codigo, 'codigo', FORMATOS_ACCESO.CODIGO, VENTA.LONGITUD_CODIGO_PLAN),
    nombre: validarTexto(body.nombre, 'nombre', VENTA.LONGITUD_NOMBRE_PLAN),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', VENTA.LONGITUD_DESCRIPCION_PLAN),
    precio: validarImporte(body.precio, 'precio', RANGO_PRECIO),
    moneda: validarMoneda(body.moneda),
    periodicidad: validarPeriodicidad(body.periodicidad),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN),
    moduloIds: validarListaIds(body.moduloIds, 'moduloIds', { maximo: VENTA.MODULOS_POR_PLAN_MAX })
  };
}

// POST /planes/estado
function validarEstadoPlan(body = {}) {
  return {
    planId: validarIdPositivo(body.planId, 'planId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

// POST /planes/modulos/precio. Precio del módulo vendido suelto; vacío = no se vende suelto.
function validarPrecioModulo(body = {}) {
  return {
    moduloId: validarIdPositivo(body.moduloId, 'moduloId'),
    precio: estaVacio(body.precio) ? null : validarImporte(body.precio, 'precio', RANGO_PRECIO),
    moneda: validarMoneda(body.moneda),
    periodicidad: validarPeriodicidad(body.periodicidad)
  };
}

module.exports = { validarGuardarPlan, validarEstadoPlan, validarPrecioModulo };
