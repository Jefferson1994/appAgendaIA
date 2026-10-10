const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TIPO_ACCESO, ALCANCE_ROL, TRANSACCION_OPCIONES } = require('../config/constantes');
const { PERMISOS_PLATAFORMA } = require('../config/permisos');
const AccesoService = require('./AccesoService');
const CategoriasService = require('./CategoriasService');
const ModulosRepository = require('../repositories/ModulosRepository');
const PermisosRepository = require('../repositories/PermisosRepository');
const RolesRepository = require('../repositories/RolesRepository');

// La plantilla del administrador de empresa no se edita: ese tipo de usuario ya ve todo.
const ROL_ADMIN_EMPRESA = TIPO_ACCESO.ADMIN_EMPRESA;

const esSuperAdmin = (usuario) => usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;
const esPlantillaAdmin = (rol) => rol.organizacionId === null && rol.codigo === ROL_ADMIN_EMPRESA;

// Ámbito de los roles que maneja el usuario: el super admin, las plantillas (null);
// el resto, los roles propios de su empresa.
function ambitoDe(usuario) {
  if (esSuperAdmin(usuario)) return null;
  if (!usuario.organizacionId) throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
  return usuario.organizacionId;
}

// true si el usuario puede modificar ese rol.
const esEditable = (rol, ambito) => rol.organizacionId === ambito && !esPlantillaAdmin(rol);

const esPermisoDeEmpresa = (permiso) => !PERMISOS_PLATAFORMA.has(permiso.codigo);

// Pantallas (con sus botones) y permisos generales que se pueden dar a un rol:
// solo los de los módulos que la empresa tiene contratados y nunca los de plataforma.
async function catalogo(usuario) {
  const [permitidos, modulos, sinPantalla] = await Promise.all([
    AccesoService.modulosPermitidos(usuario),
    ModulosRepository.listarActivosConPantallas(),
    PermisosRepository.listarSinPantalla()
  ]);

  const pantallas = modulos
    .filter((modulo) => permitidos.has(modulo.id))
    .flatMap((modulo) =>
      modulo.pantallas
        .filter((pantalla) => !pantalla.soloPlataforma)
        .map((pantalla) => ({ ...pantalla, modulo, permisos: pantalla.permisos.filter(esPermisoDeEmpresa) }))
    );

  return { pantallas, generales: sinPantalla.filter(esPermisoDeEmpresa) };
}

// Qué reserva el negocio de la empresa del usuario. El super admin (plantillas) no tiene: null.
async function reservaDe(usuario) {
  if (esSuperAdmin(usuario)) return null;
  const categoriaId = usuario.organizacion ? usuario.organizacion.categoriaId : null;
  return (await CategoriasService.perfilDeCategoria(categoriaId)).reserva;
}

async function consultar(usuario) {
  const ambito = ambitoDe(usuario);
  const [roles, disponibles, reserva] = await Promise.all([
    RolesRepository.listarParaConfiguracion(ambito),
    catalogo(usuario),
    reservaDe(usuario)
  ]);
  return { roles: roles.filter((rol) => !esPlantillaAdmin(rol)), ambito, reserva, ...disponibles };
}

// Un rol PROPIO ve las citas de su profesional: no tiene sentido donde solo se reservan espacios.
// Un rol que ya era PROPIO puede seguir así (solo se valida al pasar a PROPIO).
async function exigirAlcancePosible(usuario, alcance, actual) {
  if (alcance !== ALCANCE_ROL.PROPIO || (actual && actual.alcance === ALCANCE_ROL.PROPIO)) return;
  const reserva = await reservaDe(usuario);
  if (reserva && !CategoriasService.reservaPersonas(reserva)) {
    throw new AppError(MSG.ROL_PROPIO_NO_APLICA, HTTP.PETICION_INVALIDA);
  }
}

// Lo nuevo debe estar en el catálogo de la empresa. Lo que el rol ya tenía se puede conservar
// aunque la empresa haya dejado de tener ese módulo: no da acceso mientras no lo tenga.
function exigirAsignacionesValidas(datos, disponibles, actual) {
  const pantallas = new Map(disponibles.pantallas.map((pantalla) => [pantalla.id, pantalla]));
  const yaPantallas = new Set(actual ? actual.pantallas.map((rolPantalla) => rolPantalla.pantallaId) : []);
  const yaPermisos = new Set(actual ? actual.permisos.map((rolPermiso) => rolPermiso.permisoId) : []);

  if (!datos.pantallaIds.every((id) => pantallas.has(id) || yaPantallas.has(id))) {
    throw new AppError(MSG.ROL_PANTALLAS_INVALIDAS, HTTP.PETICION_INVALIDA);
  }

  const permisosValidos = new Set([
    ...datos.pantallaIds.flatMap((id) => (pantallas.get(id) ? pantallas.get(id).permisos.map((p) => p.id) : [])),
    ...disponibles.generales.map((permiso) => permiso.id)
  ]);
  if (!datos.permisoIds.every((id) => permisosValidos.has(id) || yaPermisos.has(id))) {
    throw new AppError(MSG.ROL_PERMISOS_INVALIDOS, HTTP.PETICION_INVALIDA);
  }
}

async function exigirRolEditable(rolId, ambito) {
  const rol = await RolesRepository.buscarDetalle(rolId);
  if (!rol) throw new AppError(MSG.ROL_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  if (!esEditable(rol, ambito)) throw new AppError(MSG.ROL_NO_EDITABLE, HTTP.PROHIBIDO);
  return rol;
}

// Crea o edita un rol con sus pantallas y botones, todo en una transacción.
async function guardar(usuario, { rolId, codigo, pantallaIds, permisoIds, ...datos }) {
  const ambito = ambitoDe(usuario);
  const actual = rolId ? await exigirRolEditable(rolId, ambito) : null;

  if (!actual && (await RolesRepository.buscarPorCodigoEnAmbito(ambito, codigo))) {
    throw new AppError(MSG.ROL_CODIGO_DUPLICADO, HTTP.CONFLICTO);
  }
  exigirAsignacionesValidas({ pantallaIds, permisoIds }, await catalogo(usuario), actual);
  await exigirAlcancePosible(usuario, datos.alcance, actual);

  const id = await prisma.$transaction(async (tx) => {
    const rol = actual
      ? await RolesRepository.actualizar(actual.id, datos, tx)
      : await RolesRepository.crear({ organizacionId: ambito, codigo, esSistema: ambito === null, ...datos }, tx);
    await RolesRepository.reemplazarPantallas(rol.id, pantallaIds, tx);
    await RolesRepository.reemplazarPermisos(rol.id, permisoIds, tx);
    return rol.id;
  }, TRANSACCION_OPCIONES);

  return { rol: await RolesRepository.buscarDetalle(id), ambito };
}

async function cambiarEstado(usuario, { rolId, activo }) {
  const ambito = ambitoDe(usuario);
  await exigirRolEditable(rolId, ambito);
  await RolesRepository.actualizar(rolId, { activo });
  return { rol: await RolesRepository.buscarDetalle(rolId), ambito };
}

module.exports = { ROL_ADMIN_EMPRESA, esEditable, esPlantillaAdmin, consultar, guardar, cambiarEstado };
