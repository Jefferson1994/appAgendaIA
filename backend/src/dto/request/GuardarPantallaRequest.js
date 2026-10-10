const { FORMATOS_ACCESO, LONGITUD_ACCESO, ORDEN_ACCESO } = require('../../config/constantes');
const {
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarFormato,
  validarTexto,
  validarEnteroEnRango,
  validarBooleano
} = require('../../utils/validaciones');

const RANGO_ORDEN = { min: ORDEN_ACCESO.MIN, max: ORDEN_ACCESO.MAX, defecto: ORDEN_ACCESO.MIN };

// POST /configuracion-modulos/pantallas/guardar. Con pantallaId edita; sin él, crea.
// La ruta es de un solo segmento (ej. /historia-clinica): el front abre el feature con ese nombre.
function validarGuardarPantalla(body = {}) {
  const pantallaId = validarIdOpcional(body.pantallaId, 'pantallaId');

  return {
    pantallaId,
    moduloId: validarIdPositivo(body.moduloId, 'moduloId'),
    codigo: pantallaId
      ? null
      : validarFormato(body.codigo, 'codigo', FORMATOS_ACCESO.CODIGO, LONGITUD_ACCESO.CODIGO_PANTALLA),
    nombre: validarTexto(body.nombre, 'nombre', LONGITUD_ACCESO.NOMBRE),
    ruta: validarFormato(body.ruta, 'ruta', FORMATOS_ACCESO.RUTA, LONGITUD_ACCESO.RUTA),
    icono: estaVacio(body.icono)
      ? null
      : validarFormato(body.icono, 'icono', FORMATOS_ACCESO.ICONO, LONGITUD_ACCESO.ICONO),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN),
    soloPlataforma: validarBooleano(body.soloPlataforma, 'soloPlataforma', false)
  };
}

module.exports = { validarGuardarPantalla };
