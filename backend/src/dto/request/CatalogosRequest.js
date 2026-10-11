const { FORMATOS_ACCESO, ORDEN_ACCESO, LONGITUD_CATALOGOS } = require('../../config/constantes');
const {
  validarIdPositivo,
  validarIdOpcional,
  validarFormato,
  validarTexto,
  validarTextoOpcional,
  validarEnteroEnRango,
  validarBooleano
} = require('../../utils/validaciones');

// Color de la etiqueta: #RRGGBB.
const FORMATO_COLOR = /^#[0-9a-fA-F]{6}$/;

const RANGO_ORDEN = { min: ORDEN_ACCESO.MIN, max: ORDEN_ACCESO.MAX, defecto: ORDEN_ACCESO.MIN };
const L = LONGITUD_CATALOGOS;

// POST /catalogos/items/guardar. Con itemId edita; sin él, crea. El código solo se fija al crear.
function validarGuardarItem(body = {}) {
  const itemId = validarIdOpcional(body.itemId, 'itemId');
  return {
    itemId,
    catalogoId: validarIdPositivo(body.catalogoId, 'catalogoId'),
    codigo: itemId ? null : validarFormato(body.codigo, 'codigo', FORMATOS_ACCESO.CODIGO, L.CODIGO),
    nombre: validarTexto(body.nombre, 'nombre', L.NOMBRE),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', L.DESCRIPCION),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN),
    color: body.color === undefined || body.color === null || body.color === ''
      ? null
      : validarFormato(body.color, 'color', FORMATO_COLOR, 7)
  };
}

// POST /catalogos/items/estado
function validarEstadoItem(body = {}) {
  return {
    itemId: validarIdPositivo(body.itemId, 'itemId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

module.exports = { validarGuardarItem, validarEstadoItem };
