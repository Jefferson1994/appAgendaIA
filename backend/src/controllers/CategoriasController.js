const CategoriasService = require('../services/CategoriasService');
const CategoriasRequest = require('../dto/request/CategoriasRequest');
const CategoriasEB = require('../eb/CategoriasEB');
const CategoriaEB = require('../eb/CategoriaEB');
const CargoEB = require('../eb/CargoEB');
const CatalogoNegociosEB = require('../eb/CatalogoNegociosEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// `publicas` no pide sesión (la usa el registro); el resto exige super admin (ver categorias.routes.js).

async function publicas(req, res) {
  const categorias = await CategoriasService.catalogoPublico();
  return ok(res, new CatalogoNegociosEB(categorias), MSG.CATEGORIAS_OK);
}

async function consultar(req, res) {
  const datos = await CategoriasService.consultar();
  return ok(res, new CategoriasEB(datos), MSG.CATEGORIAS_OK);
}

async function guardar(req, res) {
  const datos = CategoriasRequest.validarGuardarCategoria(req.body);
  const categoria = await CategoriasService.guardarCategoria(datos);
  return ok(res, new CategoriaEB(categoria), MSG.CATEGORIA_GUARDADA, datos.categoriaId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstado(req, res) {
  const datos = CategoriasRequest.validarEstadoCategoria(req.body);
  const categoria = await CategoriasService.cambiarEstadoCategoria(datos);
  return ok(res, new CategoriaEB(categoria), MSG.CATEGORIA_ESTADO_OK);
}

async function guardarCargo(req, res) {
  const datos = CategoriasRequest.validarGuardarCargo(req.body);
  const cargo = await CategoriasService.guardarCargo(datos);
  return ok(res, new CargoEB(cargo), MSG.CARGO_GUARDADO, datos.cargoId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstadoCargo(req, res) {
  const datos = CategoriasRequest.validarEstadoCargo(req.body);
  const cargo = await CategoriasService.cambiarEstadoCargo(datos);
  return ok(res, new CargoEB(cargo), MSG.CARGO_ESTADO_OK);
}

module.exports = { publicas, consultar, guardar, cambiarEstado, guardarCargo, cambiarEstadoCargo };
