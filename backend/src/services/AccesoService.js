const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TIPO_ACCESO, ALCANCE_ROL } = require('../config/constantes');
const ModulosRepository = require('../repositories/ModulosRepository');
const PermisosRepository = require('../repositories/PermisosRepository');
const OrganizacionModulosRepository = require('../repositories/OrganizacionModulosRepository');

const esAdministrador = (usuario) =>
  [TIPO_ACCESO.SUPER_ADMIN, TIPO_ACCESO.ADMIN_EMPRESA].includes(usuario.tipoAcceso);

// Ids de los módulos que el usuario puede usar:
// el super admin, todos los activos; el resto, los base más los licenciados y vigentes de su empresa.
async function modulosPermitidos(usuario) {
  const modulos = (await ModulosRepository.listar()).filter((modulo) => modulo.activo);

  if (usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN) {
    return new Set(modulos.map((modulo) => modulo.id));
  }
  if (!usuario.organizacionId) {
    return new Set();
  }

  const licencias = await OrganizacionModulosRepository.listarVigentes(usuario.organizacionId);
  const licenciados = new Set(licencias.map((licencia) => licencia.moduloId));

  return new Set(
    modulos.filter((modulo) => modulo.esBase || licenciados.has(modulo.id)).map((modulo) => modulo.id)
  );
}

// Un permiso vale si su pantalla está activa y su módulo está permitido.
// Los permisos sin pantalla no dependen de ningún módulo.
function permisosDelRol(usuario, permitidos) {
  const { rol } = usuario;
  if (!rol || !rol.activo) {
    return [];
  }

  return rol.permisos
    .map((rolPermiso) => rolPermiso.permiso)
    .filter(
      (permiso) =>
        !permiso.pantalla || (permiso.pantalla.activo && permitidos.has(permiso.pantalla.moduloId))
    )
    .map((permiso) => permiso.codigo);
}

// Códigos de permiso efectivos. El super admin tiene todo el catálogo.
async function permisosDe(usuario, permitidos) {
  if (usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN) {
    const catalogo = await PermisosRepository.listar();
    return catalogo.map((permiso) => permiso.codigo);
  }

  return permisosDelRol(usuario, permitidos || (await modulosPermitidos(usuario)));
}

// Administradores ven todas las pantallas de sus módulos; el personal, solo las de su rol.
async function construirMenu(usuario, permisos, permitidos) {
  if (usuario.tipoAcceso === TIPO_ACCESO.CLIENTE) {
    return [];
  }

  const concedidos = new Set(permisos);
  const pantallasDelRol = new Set(
    usuario.rol ? usuario.rol.pantallas.map((rolPantalla) => rolPantalla.pantallaId) : []
  );
  const verTodas = esAdministrador(usuario);

  const modulos = await ModulosRepository.listarActivosConPantallas();

  return modulos
    .filter((modulo) => permitidos.has(modulo.id))
    .map((modulo) => ({
      ...modulo,
      pantallas: modulo.pantallas
        .filter((pantalla) => verTodas || pantallasDelRol.has(pantalla.id))
        .map((pantalla) => ({
          ...pantalla,
          acciones: pantalla.permisos
            .map((permiso) => permiso.codigo)
            .filter((codigo) => concedidos.has(codigo))
        }))
    }))
    .filter((modulo) => modulo.pantallas.length > 0);
}

// Permisos y menú del usuario en un solo cálculo.
async function obtenerAcceso(usuario) {
  const permitidos = await modulosPermitidos(usuario);
  const permisos = await permisosDe(usuario, permitidos);
  const menu = await construirMenu(usuario, permisos, permitidos);

  return { permisos, menu };
}

// Hasta dónde puede ver el usuario en las pantallas de una empresa.
// La empresa siempre sale del usuario, nunca de lo que mande el cliente.
// Un rol de alcance PROPIO (ej. un doctor) queda limitado a su propio profesionalId.
function resolverAlcance(usuario, profesionalSolicitado = null) {
  if (!usuario.organizacionId) {
    throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
  }

  if (usuario.rol && usuario.rol.alcance === ALCANCE_ROL.PROPIO) {
    if (!usuario.profesionalId) {
      throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
    }
    return { organizacionId: usuario.organizacionId, profesionalId: usuario.profesionalId };
  }

  return { organizacionId: usuario.organizacionId, profesionalId: profesionalSolicitado };
}

module.exports = { permisosDe, obtenerAcceso, resolverAlcance };