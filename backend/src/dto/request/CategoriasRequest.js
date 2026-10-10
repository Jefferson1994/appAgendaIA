const { FORMATOS_ACCESO, ORDEN_ACCESO, TIPOS_RESERVA, LONGITUD_CATEGORIAS } = require('../../config/constantes');
const {
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarFormato,
  validarTexto,
  validarTextoOpcional,
  validarEnteroEnRango,
  validarBooleano,
  validarOpcion
} = require('../../utils/validaciones');

const RANGO_ORDEN = { min: ORDEN_ACCESO.MIN, max: ORDEN_ACCESO.MAX, defecto: ORDEN_ACCESO.MIN };
const OPCIONES_RESERVA = Object.values(TIPOS_RESERVA);
const L = LONGITUD_CATEGORIAS;

const validarCodigo = (valor) => validarFormato(valor, 'codigo', FORMATOS_ACCESO.CODIGO, L.CODIGO);

// POST /categorias/guardar. Con categoriaId edita; sin él, crea. El código solo se fija al crear.
// padreId vacío = categoría general; con valor = subcategoría de esa categoría.
function validarGuardarCategoria(body = {}) {
  const categoriaId = validarIdOpcional(body.categoriaId, 'categoriaId');
  return {
    categoriaId,
    codigo: categoriaId ? null : validarCodigo(body.codigo),
    padreId: validarIdOpcional(body.padreId, 'padreId'),
    nombre: validarTexto(body.nombre, 'nombre', L.NOMBRE),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', L.DESCRIPCION),
    icono: estaVacio(body.icono) ? null : validarFormato(body.icono, 'icono', FORMATOS_ACCESO.ICONO, L.ICONO),
    reserva: validarOpcion(body.reserva, 'reserva', OPCIONES_RESERVA, TIPOS_RESERVA.PERSONAS),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN)
  };
}

// POST /categorias/estado
function validarEstadoCategoria(body = {}) {
  return {
    categoriaId: validarIdPositivo(body.categoriaId, 'categoriaId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

// POST /categorias/cargos/guardar. Con cargoId edita; sin él, crea.
function validarGuardarCargo(body = {}) {
  const cargoId = validarIdOpcional(body.cargoId, 'cargoId');
  return {
    cargoId,
    codigo: cargoId ? null : validarCodigo(body.codigo),
    categoriaId: validarIdPositivo(body.categoriaId, 'categoriaId'),
    nombre: validarTexto(body.nombre, 'nombre', L.NOMBRE),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', L.DESCRIPCION),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN)
  };
}

// POST /categorias/cargos/estado
function validarEstadoCargo(body = {}) {
  return {
    cargoId: validarIdPositivo(body.cargoId, 'cargoId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

// Cargo de una persona en la empresa (registro y usuarios), más una nota libre de lo que hace.
// `esProfesional`: la persona tiene agenda propia (se le crea su profesional).
function validarPersonalEmpresa(body = {}) {
  return {
    cargoId: validarIdOpcional(body.cargoId, 'cargoId'),
    cargoObservacion: validarTextoOpcional(body.cargoObservacion, 'cargoObservacion', L.OBSERVACION_CARGO),
    esProfesional: validarBooleano(body.esProfesional, 'esProfesional', false)
  };
}

module.exports = {
  validarGuardarCategoria,
  validarEstadoCategoria,
  validarGuardarCargo,
  validarEstadoCargo,
  validarPersonalEmpresa
};
