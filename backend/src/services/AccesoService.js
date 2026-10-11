const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TIPO_ACCESO, ALCANCE_ROL, TERMINO_CLIENTE_DEFECTO } = require('../config/constantes');
const ModulosRepository = require('../repositories/ModulosRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const CategoriasService = require('./CategoriasService');
const PermisosRepository = require('../repositories/PermisosRepository');
const OrganizacionModulosRepository = require('../repositories/OrganizacionModulosRepository');
const SuscripcionesRepository = require('../repositories/SuscripcionesRepository');

const esAdministrador = (usuario) =>
  [TIPO_ACCESO.SUPER_ADMIN, TIPO_ACCESO.ADMIN_EMPRESA].includes(usuario.tipoAcceso);

// Ids de los módulos que el usuario puede usar:
// el super admin, todos los activos; el resto, los de su empresa:
// base + los del plan vigente + los comprados sueltos (licencias vigentes).
async function modulosPermitidos(usuario) {
  const modulos = (await ModulosRepository.listar()).filter((modulo) => modulo.activo);

  if (usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN) {
    return new Set(modulos.map((modulo) => modulo.id));
  }
  if (!usuario.organizacionId) {
    return new Set();
  }

  const ahora = new Date();
  const [licencias, suscripcion] = await Promise.all([
    OrganizacionModulosRepository.listarVigentes(usuario.organizacionId, ahora),
    SuscripcionesRepository.buscarVigente(usuario.organizacionId, ahora)
  ]);
  const contratados = new Set([
    ...licencias.map((licencia) => licencia.moduloId),
    ...(suscripcion ? suscripcion.plan.modulos.map((planModulo) => planModulo.moduloId) : [])
  ]);

  return new Set(
    modulos.filter((modulo) => modulo.esBase || contratados.has(modulo.id)).map((modulo) => modulo.id)
  );
}

// Las pantallas de plataforma (soloPlataforma) son exclusivas del super admin, aunque su módulo sea base.
const pantallaVisiblePara = (usuario, pantalla) =>
  !pantalla.soloPlataforma || usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;

// Lo que depende del negocio de la empresa: los tipos de recurso que usa (null = super admin:
// todos) y cómo llama a sus clientes (null = super admin: el nombre de la pantalla tal cual).
async function negocioDe(usuario) {
  if (usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN) return { tipos: null, terminoCliente: null };
  const categoriaId = usuario.organizacion ? usuario.organizacion.categoriaId : null;
  const { reserva, terminoCliente } = await CategoriasService.perfilDeCategoria(categoriaId);
  return { tipos: CategoriasService.tiposRecursoDe(reserva), terminoCliente: terminoCliente || TERMINO_CLIENTE_DEFECTO };
}

async function tiposRecursoPermitidos(usuario) {
  return (await negocioDe(usuario)).tipos;
}

// Pantallas con `nombrePorNegocio` toman el término del negocio (Pacientes en una clínica,
// Clientes en una cancha); su módulo también, si se llamaba igual que la pantalla.
function nombrarPorNegocio(menu, termino) {
  if (!termino) return menu;
  return menu.map((modulo) => {
    const renombradas = modulo.pantallas.filter((pantalla) => pantalla.nombrePorNegocio);
    return {
      ...modulo,
      nombre: renombradas.some((pantalla) => pantalla.nombre === modulo.nombre) ? termino : modulo.nombre,
      pantallas: modulo.pantallas.map((pantalla) => (pantalla.nombrePorNegocio ? { ...pantalla, nombre: termino } : pantalla))
    };
  });
}

// Una pantalla atada a un tipo de recurso (Profesionales, Instalaciones) solo se ofrece a
// las empresas cuyo negocio lo usa: una cancha no ve "Profesionales" ni una clínica "Instalaciones".
const aplicaAlNegocio = (pantalla, tipos) =>
  !pantalla.tipoRecurso || tipos === null || tipos.includes(pantalla.tipoRecurso.codigo);

// Un permiso vale si su pantalla está activa, es visible para el usuario y su módulo está permitido.
// Los permisos sin pantalla no dependen de ningún módulo.
const permisoVigente = (usuario, permitidos) => (permiso) =>
  !permiso.pantalla ||
  (permiso.pantalla.activo &&
    pantallaVisiblePara(usuario, permiso.pantalla) &&
    permitidos.has(permiso.pantalla.moduloId));

function permisosDelRol(usuario, permitidos) {
  const { rol } = usuario;
  if (!rol || !rol.activo) {
    return [];
  }

  return rol.permisos
    .map((rolPermiso) => rolPermiso.permiso)
    .filter(permisoVigente(usuario, permitidos))
    .map((permiso) => permiso.codigo);
}

// Códigos de permiso efectivos. El super admin tiene todo el catálogo.
// El administrador de empresa tiene todos los de los módulos de su empresa, incluidos
// los botones que se agreguen después a sus pantallas; el personal, los de su rol.
async function permisosDe(usuario, permitidos) {
  if (usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN) {
    const catalogo = await PermisosRepository.listar();
    return catalogo.map((permiso) => permiso.codigo);
  }

  const modulos = permitidos || (await modulosPermitidos(usuario));

  if (usuario.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA) {
    const catalogo = await PermisosRepository.listarConPantalla();
    return catalogo.filter(permisoVigente(usuario, modulos)).map((permiso) => permiso.codigo);
  }

  return permisosDelRol(usuario, modulos);
}

// Botones de una pantalla que el usuario puede usar, en el orden del catálogo de acciones.
function botonesConcedidos(pantalla, concedidos) {
  return pantalla.permisos
    .filter((permiso) => concedidos.has(permiso.codigo) && permiso.accion && permiso.accion.activo)
    .map((permiso) => ({ permiso: permiso.codigo, accion: permiso.accion }))
    .sort((a, b) => a.accion.orden - b.accion.orden);
}

// Administradores ven todas las pantallas de sus módulos; el personal, solo las de su rol.
async function construirMenu(usuario, permisos, permitidos, tipos) {
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
        .filter((pantalla) => pantallaVisiblePara(usuario, pantalla) && aplicaAlNegocio(pantalla, tipos))
        // `paraTodos` (p. ej. Mi perfil): la ve cualquier usuario aunque su rol no la tenga.
        .filter((pantalla) => verTodas || pantalla.paraTodos || pantallasDelRol.has(pantalla.id))
        .map((pantalla) => ({
          ...pantalla,
          acciones: pantalla.permisos
            .map((permiso) => permiso.codigo)
            .filter((codigo) => concedidos.has(codigo)),
          botones: botonesConcedidos(pantalla, concedidos)
        }))
    }))
    .filter((modulo) => modulo.pantallas.length > 0);
}

// Permisos y menú del usuario en un solo cálculo.
async function obtenerAcceso(usuario) {
  const permitidos = await modulosPermitidos(usuario);
  const permisos = await permisosDe(usuario, permitidos);
  const negocio = await negocioDe(usuario);
  const menu = nombrarPorNegocio(await construirMenu(usuario, permisos, permitidos, negocio.tipos), negocio.terminoCliente);

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

// Empresa y alcance de una pantalla de empresa. El super admin elige la empresa
// (`organizacionId`); para cualquier otro usuario se ignora y se usa la de su token.
async function resolverEmpresaYAlcance(usuario, { organizacionId = null, profesionalId = null } = {}) {
  if (usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN) {
    if (!organizacionId) throw new AppError(MSG.EMPRESA_REQUERIDA, HTTP.PETICION_INVALIDA);
    const organizacion = await OrganizacionesRepository.buscarActivaPorId(organizacionId);
    if (!organizacion) throw new AppError(MSG.ORGANIZACION_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
    return { organizacion, alcance: { organizacionId: organizacion.id, profesionalId } };
  }
  return { organizacion: usuario.organizacion, alcance: resolverAlcance(usuario, profesionalId) };
}

module.exports = {
  modulosPermitidos,
  permisosDe,
  obtenerAcceso,
  resolverAlcance,
  resolverEmpresaYAlcance,
  tiposRecursoPermitidos,
  negocioDe,
  aplicaAlNegocio
};