const SuscripcionService = require('../services/SuscripcionService');
const SuscripcionRequest = require('../dto/request/SuscripcionRequest');
const MiSuscripcionEB = require('../eb/MiSuscripcionEB');
const SuscripcionEB = require('../eb/SuscripcionEB');
const LicenciaModuloEB = require('../eb/LicenciaModuloEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Todas las rutas exigen administrador de empresa (ver suscripcion.routes.js).
// La empresa sale de req.usuario, nunca del body.

async function consultar(req, res) {
  const datos = await SuscripcionService.consultar(req.usuario);
  return ok(res, new MiSuscripcionEB(datos), MSG.SUSCRIPCION_OK);
}

async function cambiarPlan(req, res) {
  const datos = SuscripcionRequest.validarCambiarPlan(req.body);
  const suscripcion = await SuscripcionService.cambiarPlan(req.usuario, datos);

  return ok(res, new SuscripcionEB(suscripcion), MSG.PLAN_CAMBIADO(suscripcion.plan.nombre), HTTP.CREADO);
}

async function comprarModulo(req, res) {
  const datos = SuscripcionRequest.validarModuloSuelto(req.body);
  const licencia = await SuscripcionService.comprarModulo(req.usuario, datos);

  return ok(res, new LicenciaModuloEB(licencia), MSG.MODULO_COMPRADO(licencia.modulo.nombre), HTTP.CREADO);
}

async function cancelarModulo(req, res) {
  const datos = SuscripcionRequest.validarModuloSuelto(req.body);
  const licencia = await SuscripcionService.cancelarModulo(req.usuario, datos);

  return ok(res, new LicenciaModuloEB(licencia), MSG.MODULO_CANCELADO(licencia.modulo.nombre));
}

module.exports = { consultar, cambiarPlan, comprarModulo, cancelarModulo };
