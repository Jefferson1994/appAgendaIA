const ServiciosService = require('../services/ServiciosService');
const ServicioRequest = require('../dto/request/ServicioRequest');
const ServicioEB = require('../eb/ServicioEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function listar(req, res) {
  const { profesionalId, canalId, texto } = ServicioRequest.validarListar(req.query);
  const { profesional, relaciones } = canalId
    ? await ServiciosService.listarPorCanal(canalId, texto)
    : await ServiciosService.listar(profesionalId, texto);

  return ok(
    res,
    relaciones.map((relacion) => new ServicioEB(relacion, profesional)),
    MSG.SERVICIOS_OK
  );
}

async function obtenerPorId(req, res) {
  const { profesionalId, servicioId } = ServicioRequest.validarPorId(req.params, req.query);
  const { profesional, relacion } = await ServiciosService.obtenerPorId(profesionalId, servicioId);

  return ok(res, new ServicioEB(relacion, profesional), MSG.SERVICIO_OK);
}

module.exports = { listar, obtenerPorId };
