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
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN)
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
