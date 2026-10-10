const PlanesService = require('../services/PlanesService');
const PlanesRequest = require('../dto/request/PlanesRequest');
const PlanesEB = require('../eb/PlanesEB');
const PlanEB = require('../eb/PlanEB');
const ModuloVentaEB = require('../eb/ModuloVentaEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Todas las rutas exigen super admin (ver planes.routes.js).

async function consultar(req, res) {
  const datos = await PlanesService.consultar();
  return ok(res, new PlanesEB(datos), MSG.PLANES_OK);
}

async function guardar(req, res) {
  const datos = PlanesRequest.validarGuardarPlan(req.body);
  const plan = await PlanesService.guardarPlan(datos);

  return ok(res, new PlanEB(plan), MSG.PLAN_GUARDADO, datos.planId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstado(req, res) {
  const datos = PlanesRequest.validarEstadoPlan(req.body);
  const plan = await PlanesService.cambiarEstadoPlan(datos);

  return ok(res, new PlanEB(plan), MSG.PLAN_ESTADO_OK);
}

async function guardarPrecioModulo(req, res) {
  const datos = PlanesRequest.validarPrecioModulo(req.body);
  const modulo = await PlanesService.guardarPrecioModulo(datos);

  return ok(res, new ModuloVentaEB(modulo), MSG.PRECIO_MODULO_GUARDADO);
}

module.exports = { consultar, guardar, cambiarEstado, guardarPrecioModulo };
