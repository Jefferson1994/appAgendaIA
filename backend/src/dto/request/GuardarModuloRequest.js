const { FORMATOS_ACCESO, LONGITUD_ACCESO, ORDEN_ACCESO } = require('../../config/constantes');
const {
  estaVacio,
  validarIdOpcional,
  validarFormato,
  validarTexto,
  validarTextoOpcional,
  validarEnteroEnRango,
  validarBooleano
} = require('../../utils/validaciones');

const RANGO_ORDEN = { min: ORDEN_ACCESO.MIN, max: ORDEN_ACCESO.MAX, defecto: ORDEN_ACCESO.MIN };

// POST /configuracion-modulos/modulos/guardar. Con moduloId edita; sin él, crea.
// El código solo se fija al crear: después lo referencian los seeds y las licencias.
function validarGuardarModulo(body = {}) {
  const moduloId = validarIdOpcional(body.moduloId, 'moduloId');

  return {
    moduloId,
    codigo: moduloId
      ? null
      : validarFormato(body.codigo, 'codigo', FORMATOS_ACCESO.CODIGO, LONGITUD_ACCESO.CODIGO_MODULO),
    nombre: validarTexto(body.nombre, 'nombre', LONGITUD_ACCESO.NOMBRE),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', LONGITUD_ACCESO.DESCRIPCION),
    icono: estaVacio(body.icono)
      ? null
      : validarFormato(body.icono, 'icono', FORMATOS_ACCESO.ICONO, LONGITUD_ACCESO.ICONO),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN),
    esBase: validarBooleano(body.esBase, 'esBase', false)
  };
}

module.exports = { validarGuardarModulo };
