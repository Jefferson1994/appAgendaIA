const RecursosService = require('../services/RecursosService');
const RecursosRequest = require('../dto/request/RecursosRequest');
const { RecursoEB, RecursosEB } = require('../eb/RecursosEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// El permiso depende del tipo (profesionales.* o instalaciones.*): lo revisa el servicio.

async function consultar(req, res) {
  const filtros = RecursosRequest.validarConsulta(req.body);
  return ok(res, new RecursosEB(await RecursosService.consultar(req.usuario, filtros)), MSG.RECURSOS_OK);
}

async function guardar(req, res) {
  const datos = RecursosRequest.validarGuardar(req.body);
  const recurso = await RecursosService.guardar(req.usuario, datos);
  return ok(res, new RecursoEB(recurso), MSG.RECURSO_GUARDADO, datos.recursoId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstado(req, res) {
  const datos = RecursosRequest.validarEstado(req.body);
  return ok(res, new RecursoEB(await RecursosService.cambiarEstado(req.usuario, datos)), MSG.RECURSO_ESTADO_OK);
}

module.exports = { consultar, guardar, cambiarEstado };
