const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX, TIPOS_RECURSO, RECURSOS, DIAS_SEMANA } = require('../../config/constantes');
const {
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarTexto,
  validarTextoOpcional,
  validarEnteroEnRango,
  validarBooleano,
  validarOpcion,
  validarListaIds
} = require('../../utils/validaciones');

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const HORARIOS_LISTA_MAX = 70;
const FOTOS_LISTA_MAX = 10;
const DESCRIPCION_MAX = 1000;

const validarTipo = (valor) => validarOpcion(valor, 'tipo', Object.values(TIPOS_RECURSO));

function validarHora(valor, campo) {
  if (typeof valor !== 'string' || !FORMATO_HORA.test(valor)) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return valor;
}

// Lista completa de franjas: [{ diaSemana: 'LUNES', horaInicio: '08:00', horaFin: '12:00' }]. null = no cambiar.
function validarHorarios(lista) {
  if (lista === undefined || lista === null) return null;
  if (!Array.isArray(lista) || lista.length > HORARIOS_LISTA_MAX) {
    throw new AppError(MSG.DATO_INVALIDO('horarios'), HTTP.PETICION_INVALIDA);
  }
  return lista.map((item = {}) => ({
    diaSemana: validarOpcion(item.diaSemana, 'horarios.diaSemana', Object.values(DIAS_SEMANA)),
    horaInicio: validarHora(item.horaInicio, 'horarios.horaInicio'),
    horaFin: validarHora(item.horaFin, 'horarios.horaFin')
  }));
}

// POST /recursos/consultar
function validarConsulta(body = {}) {
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    tipo: validarTipo(body.tipo),
    incluirInactivos: validarBooleano(body.incluirInactivos, 'incluirInactivos', false)
  };
}

// POST /recursos/guardar. Con recursoId edita; sin él, crea (solo instalaciones).
// `horarios` y `fotoIds` son listas completas; si no vienen, no se cambian.
function validarGuardar(body = {}) {
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    recursoId: validarIdOpcional(body.recursoId, 'recursoId'),
    tipo: validarTipo(body.tipo),
    nombre: estaVacio(body.nombre) ? null : validarTexto(body.nombre, 'nombre', LONGITUD_MAX.NOMBRE),
    descripcion: validarTextoOpcional(body.descripcion, 'descripcion', DESCRIPCION_MAX),
    intervaloAgendaMinutos: validarEnteroEnRango(body.intervaloAgendaMinutos, 'intervaloAgendaMinutos', {
      min: RECURSOS.INTERVALO_MIN,
      max: RECURSOS.INTERVALO_MAX,
      defecto: RECURSOS.INTERVALO_DEFECTO
    }),
    horarios: validarHorarios(body.horarios),
    fotoIds: body.fotoIds === undefined || body.fotoIds === null
      ? null
      : validarListaIds(body.fotoIds, 'fotoIds', { maximo: FOTOS_LISTA_MAX })
  };
}

// POST /recursos/estado
function validarEstado(body = {}) {
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    recursoId: validarIdPositivo(body.recursoId, 'recursoId'),
    tipo: validarTipo(body.tipo),
    activo: validarBooleano(body.activo, 'activo')
  };
}

module.exports = { validarConsulta, validarGuardar, validarEstado };
