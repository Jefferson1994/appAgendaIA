const RolesService = require('../services/RolesService');
const RolRequest = require('../dto/request/RolRequest');
const RolesEB = require('../eb/RolesEB');
const RolConfiguracionEB = require('../eb/RolConfiguracionEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Super admin: plantillas para todas las empresas. Administrador de empresa: roles propios.
// El ámbito sale del usuario autenticado (ver RolesService.ambitoDe).

async function consultar(req, res) {
  const datos = await RolesService.consultar(req.usuario);
  return ok(res, new RolesEB(datos), MSG.ROLES_OK);
}

async function guardar(req, res) {
  const datos = RolRequest.validarGuardarRol(req.body);
  const { rol, ambito } = await RolesService.guardar(req.usuario, datos);

  return ok(
    res,
    new RolConfiguracionEB(rol, { editable: RolesService.esEditable(rol, ambito) }),
    MSG.ROL_GUARDADO,
    datos.rolId ? HTTP.OK : HTTP.CREADO
  );
}

async function cambiarEstado(req, res) {
  const datos = RolRequest.validarEstadoRol(req.body);
  const { rol, ambito } = await RolesService.cambiarEstado(req.usuario, datos);

  return ok(res, new RolConfiguracionEB(rol, { editable: RolesService.esEditable(rol, ambito) }), MSG.ROL_ESTADO_OK);
}

module.exports = { consultar, guardar, cambiarEstado };
