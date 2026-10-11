const EmpresaService = require('../services/EmpresaService');
const EmpresaRequest = require('../dto/request/EmpresaRequest');
const EmpresaEB = require('../eb/EmpresaEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function consultar(req, res) {
  const filtros = EmpresaRequest.validarConsulta(req.body);
  return ok(res, new EmpresaEB(await EmpresaService.consultar(req.usuario, filtros)), MSG.EMPRESA_OK);
}

async function guardarHorario(req, res) {
  const datos = EmpresaRequest.validarHorario(req.body);
  return ok(res, new EmpresaEB(await EmpresaService.guardarHorario(req.usuario, datos)), MSG.EMPRESA_HORARIO_GUARDADO);
}

module.exports = { consultar, guardarHorario };
