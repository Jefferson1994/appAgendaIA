const CatalogosService = require('../services/CatalogosService');
const CatalogosRequest = require('../dto/request/CatalogosRequest');
const { CatalogosEB, aItem } = require('../eb/CatalogosEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Todas las rutas exigen super admin (ver catalogos.routes.js).

async function consultar(req, res) {
  return ok(res, new CatalogosEB(await CatalogosService.consultar()), MSG.CATALOGOS_OK);
}

async function guardarItem(req, res) {
  const datos = CatalogosRequest.validarGuardarItem(req.body);
  const item = await CatalogosService.guardarItem(datos);
  return ok(res, aItem(item), MSG.CATALOGO_ITEM_GUARDADO, datos.itemId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstadoItem(req, res) {
  const datos = CatalogosRequest.validarEstadoItem(req.body);
  return ok(res, aItem(await CatalogosService.cambiarEstadoItem(datos)), MSG.CATALOGO_ITEM_ESTADO_OK);
}

module.exports = { consultar, guardarItem, cambiarEstadoItem };
