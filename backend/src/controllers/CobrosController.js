const CobrosService = require('../services/CobrosService');
const CobrosRequest = require('../dto/request/CobrosRequest');
const { MedioCobroEB, CobrosEmpresaEB, MisCobrosEB } = require('../eb/CobrosEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// La empresa y el profesional siempre salen del usuario autenticado, nunca del body.

// ---------- Administrador de la empresa (permiso cobros.gestionar) ----------

async function consultar(req, res) {
  return ok(res, new CobrosEmpresaEB(await CobrosService.consultarEmpresa(req.usuario)), MSG.COBROS_OK);
}

async function guardarPolitica(req, res) {
  const datos = CobrosRequest.validarPolitica(req.body);
  return ok(res, new CobrosEmpresaEB(await CobrosService.guardarPolitica(req.usuario, datos)), MSG.POLITICA_COBRO_GUARDADA);
}

async function guardarMedio(req, res) {
  const datos = CobrosRequest.validarGuardarMedio(req.body);
  const medio = await CobrosService.guardarMedioEmpresa(req.usuario, datos);
  return ok(res, new MedioCobroEB(medio), MSG.MEDIO_COBRO_GUARDADO, datos.medioId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstadoMedio(req, res) {
  const datos = CobrosRequest.validarEstadoMedio(req.body);
  return ok(res, new MedioCobroEB(await CobrosService.cambiarEstadoMedioEmpresa(req.usuario, datos)), MSG.MEDIO_COBRO_ESTADO_OK);
}

// ---------- El profesional: sus propias cuentas ----------

async function consultarMios(req, res) {
  return ok(res, new MisCobrosEB(await CobrosService.consultarMios(req.usuario)), MSG.COBROS_OK);
}

async function guardarMio(req, res) {
  const datos = CobrosRequest.validarGuardarMedio(req.body);
  const medio = await CobrosService.guardarMio(req.usuario, datos);
  return ok(res, new MedioCobroEB(medio), MSG.MEDIO_COBRO_GUARDADO, datos.medioId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstadoMio(req, res) {
  const datos = CobrosRequest.validarEstadoMedio(req.body);
  return ok(res, new MedioCobroEB(await CobrosService.cambiarEstadoMio(req.usuario, datos)), MSG.MEDIO_COBRO_ESTADO_OK);
}

module.exports = {
  consultar,
  guardarPolitica,
  guardarMedio,
  cambiarEstadoMedio,
  consultarMios,
  guardarMio,
  cambiarEstadoMio
};
