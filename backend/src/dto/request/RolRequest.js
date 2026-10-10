const { FORMATOS_ACCESO, ALCANCE_ROL } = require('../../config/constantes');
const {
  validarIdPositivo,
  validarIdOpcional,
  validarFormato,
  validarTexto,
  validarTextoOpcional,
  validarBooleano,
  validarOpcion,
  validarListaIds
} = require('../../utils/validaciones');

// Largos de la tabla roles (schema.prisma).
const LARGO = { CODIGO: 60, NOMBRE: 100, DESCRIPCION: 250 };
const MAXIMO_ELEMENTOS = 500;

// POST /roles/guardar. Con rolId edita; sin él, crea. El código solo se fija al crear.
// `pantallaIds` y `permisoIds` son las listas completas del rol (reemplazan las anteriores).
function validarGuardarRol(body = {}) {
  const rolId = validarIdOpcional(body.rolId, 'rolId');

  return {
    rolId,
    codigo: rolId ? null : validarFormato(body.codigo, 'codigo', FORMATOS_ACCESO.CODIGO, LARGO.CODIGO),
    nombre: validarTexto(body.nombre, 'nombre', LARGO.NOMBRE),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', LARGO.DESCRIPCION),
    alcance: validarOpcion(body.alcance, 'alcance', Object.values(ALCANCE_ROL), ALCANCE_ROL.ORGANIZACION),
    pantallaIds: validarListaIds(body.pantallaIds, 'pantallaIds', { maximo: MAXIMO_ELEMENTOS }),
    permisoIds: validarListaIds(body.permisoIds, 'permisoIds', { maximo: MAXIMO_ELEMENTOS })
  };
}

// POST /roles/estado
function validarEstadoRol(body = {}) {
  return {
    rolId: validarIdPositivo(body.rolId, 'rolId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

module.exports = { validarGuardarRol, validarEstadoRol };
