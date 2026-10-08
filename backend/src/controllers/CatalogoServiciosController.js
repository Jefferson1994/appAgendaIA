const CatalogoServiciosService = require('../services/CatalogoServiciosService');
const ConsultaServiciosRequest = require('../dto/request/ConsultaServiciosRequest');
const GuardarServicioRequest = require('../dto/request/GuardarServicioRequest');
const EstadoServicioRequest = require('../dto/request/EstadoServicioRequest');
const ServicioCatalogoEB = require('../eb/ServicioCatalogoEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Requiere autenticar, que deja al usuario cargado en req.usuario.
async function consultar(req, res) {
  const filtros = ConsultaServiciosRequest.validarConsultaServicios(req.body);
  const servicios = await CatalogoServiciosService.consultar(req.usuario, filtros);

  return ok(res, servicios.map((servicio) => new ServicioCatalogoEB(servicio)), MSG.SERVICIOS_OK);
}

async function guardar(req, res) {
  const datos = GuardarServicioRequest.validarGuardarServicio(req.body);
  const servicio = await CatalogoServiciosService.guardar(req.usuario, datos);

  return ok(
    res,
    new ServicioCatalogoEB(servicio),
    MSG.SERVICIO_GUARDADO,
    datos.servicioId ? HTTP.OK : HTTP.CREADO
  );
}

async function cambiarEstado(req, res) {
  const datos = EstadoServicioRequest.validarEstadoServicio(req.body);
  const servicio = await CatalogoServiciosService.cambiarEstado(req.usuario, datos);

  return ok(res, new ServicioCatalogoEB(servicio), MSG.SERVICIO_ESTADO_OK);
}

module.exports = { consultar, guardar, cambiarEstado };