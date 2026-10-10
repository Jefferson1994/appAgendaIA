const ConfiguracionModulosService = require('../services/ConfiguracionModulosService');
const GuardarModuloRequest = require('../dto/request/GuardarModuloRequest');
const GuardarPantallaRequest = require('../dto/request/GuardarPantallaRequest');
const AsignarAccionesRequest = require('../dto/request/AsignarAccionesRequest');
const EstadoConfiguracionRequest = require('../dto/request/EstadoConfiguracionRequest');
const ConfiguracionModulosEB = require('../eb/ConfiguracionModulosEB');
const ModuloConfiguracionEB = require('../eb/ModuloConfiguracionEB');
const PantallaConfiguracionEB = require('../eb/PantallaConfiguracionEB');
const BotonConfiguracionEB = require('../eb/BotonConfiguracionEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Todas las rutas exigen super admin (ver configuracion.modulos.routes.js).

async function consultar(req, res) {
  const configuracion = await ConfiguracionModulosService.consultar();
  return ok(res, new ConfiguracionModulosEB(configuracion), MSG.CONFIGURACION_MODULOS_OK);
}

async function guardarModulo(req, res) {
  const datos = GuardarModuloRequest.validarGuardarModulo(req.body);
  const modulo = await ConfiguracionModulosService.guardarModulo(datos);

  return ok(res, new ModuloConfiguracionEB(modulo), MSG.MODULO_GUARDADO, datos.moduloId ? HTTP.OK : HTTP.CREADO);
}

async function cambiarEstadoModulo(req, res) {
  const datos = EstadoConfiguracionRequest.validarEstadoModulo(req.body);
  const modulo = await ConfiguracionModulosService.cambiarEstadoModulo(datos);

  return ok(res, new ModuloConfiguracionEB(modulo), MSG.MODULO_ESTADO_OK);
}

async function guardarPantalla(req, res) {
  const datos = GuardarPantallaRequest.validarGuardarPantalla(req.body);
  const pantalla = await ConfiguracionModulosService.guardarPantalla(datos);

  return ok(
    res,
    new PantallaConfiguracionEB(pantalla),
    MSG.PANTALLA_GUARDADA,
    datos.pantallaId ? HTTP.OK : HTTP.CREADO
  );
}

async function cambiarEstadoPantalla(req, res) {
  const datos = EstadoConfiguracionRequest.validarEstadoPantalla(req.body);
  const pantalla = await ConfiguracionModulosService.cambiarEstadoPantalla(datos);

  return ok(res, new PantallaConfiguracionEB(pantalla), MSG.PANTALLA_ESTADO_OK);
}

async function asignarAcciones(req, res) {
  const datos = AsignarAccionesRequest.validarAsignarAcciones(req.body);
  const pantalla = await ConfiguracionModulosService.asignarAcciones(datos);

  return ok(res, new PantallaConfiguracionEB(pantalla), MSG.ACCIONES_ASIGNADAS);
}

async function eliminarBoton(req, res) {
  const datos = EstadoConfiguracionRequest.validarEliminarBoton(req.body);
  const boton = await ConfiguracionModulosService.eliminarBoton(datos);

  return ok(res, new BotonConfiguracionEB(boton), MSG.BOTON_ELIMINADO);
}

module.exports = {
  consultar,
  guardarModulo,
  cambiarEstadoModulo,
  guardarPantalla,
  cambiarEstadoPantalla,
  asignarAcciones,
  eliminarBoton
};
