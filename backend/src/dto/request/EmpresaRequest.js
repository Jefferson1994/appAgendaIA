const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, DIAS_SEMANA } = require('../../config/constantes');
const { validarIdOpcional, validarOpcion } = require('../../utils/validaciones');

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FRANJAS_LISTA_MAX = 70;

function validarHora(valor, campo) {
  if (typeof valor !== 'string' || !FORMATO_HORA.test(valor)) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return valor;
}

// POST /empresa/consultar. `organizacionId` solo lo usa el super admin.
function validarConsulta(body = {}) {
  return { organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId') };
}

// POST /empresa/horario: lista completa de franjas (vacía = sin horario definido).
function validarHorario(body = {}) {
  const lista = body.horarios;
  if (!Array.isArray(lista) || lista.length > FRANJAS_LISTA_MAX) {
    throw new AppError(MSG.DATO_INVALIDO('horarios'), HTTP.PETICION_INVALIDA);
  }
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    horarios: lista.map((item = {}) => ({
      diaSemana: validarOpcion(item.diaSemana, 'horarios.diaSemana', Object.values(DIAS_SEMANA)),
      horaInicio: validarHora(item.horaInicio, 'horarios.horaInicio'),
      horaFin: validarHora(item.horaFin, 'horarios.horaFin')
    }))
  };
}

module.exports = { validarConsulta, validarHorario };
