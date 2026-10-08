const { DateTime } = require('luxon');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, AGENDA } = require('../../config/constantes');
const { validarIdPositivo } = require('../../utils/validaciones');

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';
const invalido = (campo) => new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);

function validarFecha(valor, campo) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!FORMATO_FECHA.test(texto) || !DateTime.fromISO(texto, { zone: 'utc' }).isValid) {
    throw invalido(campo);
  }
  return texto;
}

function validarFiltro(valor) {
  if (vacio(valor)) {
    return AGENDA.FILTRO_DEFECTO;
  }

  const filtro = String(valor).trim().toUpperCase();
  if (!AGENDA.FILTROS[filtro]) {
    throw invalido('filtro');
  }
  return filtro;
}

// POST /citas/agenda. Todo es opcional: sin fechas se muestra el día de hoy de la empresa.
// La empresa no viaja en el body: sale del usuario autenticado.
function validarConsultaAgenda(body = {}) {
  const desde = vacio(body.desde) ? null : validarFecha(body.desde, 'desde');
  const hasta = vacio(body.hasta) ? null : validarFecha(body.hasta, 'hasta');

  if (hasta && !desde) {
    throw invalido('desde');
  }

  if (desde && hasta) {
    const dias = DateTime.fromISO(hasta, { zone: 'utc' }).diff(DateTime.fromISO(desde, { zone: 'utc' }), 'days').days;
    if (dias < 0 || dias + 1 > AGENDA.MAX_DIAS_RANGO) {
      throw invalido('hasta');
    }
  }

  return {
    desde,
    hasta,
    filtro: validarFiltro(body.filtro),
    profesionalId: vacio(body.profesionalId) ? null : validarIdPositivo(body.profesionalId, 'profesionalId')
  };
}

module.exports = { validarConsultaAgenda };