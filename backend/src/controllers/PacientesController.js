const PacientesService = require('../services/PacientesService');
const PacienteRequest = require('../dto/request/PacienteRequest');
const PacienteEB = require('../eb/PacienteEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function listar(req, res) {
  const { organizacionId } = PacienteRequest.validarListar(req.query);
  const clientes = await PacientesService.listar(organizacionId);

  return ok(res, clientes.map((cliente) => new PacienteEB(cliente)), MSG.CLIENTES_OK);
}

async function registrar(req, res) {
  const datos = PacienteRequest.validarRegistro(req.body);
  const { nuevo, cliente } = await PacientesService.registrar(datos);

  return ok(
    res,
    { nuevo, cliente: new PacienteEB(cliente) },
    nuevo ? MSG.CLIENTE_REGISTRADO : MSG.CLIENTE_EXISTENTE
  );
}

module.exports = { listar, registrar };