const ClientesService = require('../services/ClientesService');
const ConsultaClientesRequest = require('../dto/request/ConsultaClientesRequest');
const ClientesPaginaEB = require('../eb/ClientesPaginaEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

// Requiere autenticar, que deja al usuario cargado en req.usuario.
async function consultar(req, res) {
  const filtros = ConsultaClientesRequest.validarConsultaClientes(req.body);
  const resultado = await ClientesService.consultar(req.usuario, filtros);

  return ok(res, new ClientesPaginaEB(resultado), MSG.CLIENTES_OK);
}

module.exports = { consultar };