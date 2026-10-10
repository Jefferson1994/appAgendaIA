const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TIPO_ACCESO, ALCANCE_ROL, TRANSACCION_OPCIONES } = require('../config/constantes');
const { hashear, generarClaveTemporal } = require('../security/passwords');
const CorreoService = require('./correo/CorreoService');
const plantillasCorreo = require('./correo/plantillas');
const { ROL_ADMIN_EMPRESA, esPlantillaAdmin } = require('./RolesService');
const UsuariosRepository = require('../repositories/UsuariosRepository');
const PersonasRepository = require('../repositories/PersonasRepository');
const RolesRepository = require('../repositories/RolesRepository');
const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');
const RefreshTokensRepository = require('../repositories/RefreshTokensRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const ProfesionalesService = require('./ProfesionalesService');
const CategoriasService = require('./CategoriasService');

const ERROR_UNICO_PRISMA = 'P2002';

const invalido = (mensaje) => new AppError(mensaje, HTTP.PETICION_INVALIDA);

const esAdministrador = (usuario) => usuario.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA;
const esPlataforma = (usuario) => usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;

// Empresa sobre la que actúa el usuario: la de su token, o (solo el super admin) la que elige.
// El `organizacionId` que manda un usuario de empresa se ignora: nunca puede tocar otra empresa.
async function empresaDe(actor, organizacionId) {
  if (esPlataforma(actor)) {
    if (!organizacionId) throw invalido(MSG.EMPRESA_REQUERIDA);
    const empresa = await OrganizacionesRepository.buscarActivaPorId(organizacionId);
    if (!empresa) throw new AppError(MSG.ORGANIZACION_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
    return { id: empresa.id, nombre: empresa.nombreComercial || empresa.nombre, categoriaId: empresa.categoriaId };
  }

  if (!actor.organizacionId) throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
  const { organizacion } = actor;
  return {
    id: actor.organizacionId,
    nombre: organizacion ? organizacion.nombre : null,
    categoriaId: organizacion ? organizacion.categoriaId : null
  };
}

// Solo el administrador de la empresa o el super admin crean, editan o promueven administradores.
function exigirPuedeTocarAdministrador(actor, involucraAdministrador) {
  if (involucraAdministrador && !esAdministrador(actor) && !esPlataforma(actor)) {
    throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
  }
}

function traducirErrorUnico(error) {
  if (!error || error.code !== ERROR_UNICO_PRISMA) return error;
  const campos = String((error.meta && error.meta.target) || '');
  return new AppError(
    campos.includes('identificacion') ? MSG.IDENTIFICACION_YA_REGISTRADA : MSG.CORREO_YA_REGISTRADO,
    HTTP.CONFLICTO
  );
}

// El super admin recibe además las empresas; hasta que elige una, la lista de usuarios va vacía.
async function consultar(actor, { organizacionId } = {}) {
  const empresas = esPlataforma(actor) ? await OrganizacionesRepository.listarActivas() : null;
  if (empresas && !organizacionId) return { empresas, usuarios: [], roles: [], profesionales: [] };

  const empresa = await empresaDe(actor, organizacionId);
  const [usuarios, roles, profesionales, perfil] = await Promise.all([
    UsuariosRepository.listarPorOrganizacion(empresa.id),
    RolesRepository.listarVisibles(empresa.id),
    ProfesionalesRepository.listarActivosDeOrganizacion(empresa.id),
    CategoriasService.perfilDeCategoria(empresa.categoriaId)
  ]);
  return {
    empresas,
    usuarios,
    roles: roles.filter((rol) => !esPlantillaAdmin(rol)),
    profesionales,
    reserva: perfil.reserva,
    cargos: perfil.cargos
  };
}

// Cargo de la persona y si puede ser profesional, según el tipo de negocio de la empresa.
// En un negocio que solo reserva espacios (cancha, restaurante) nadie se vuelve profesional.
// Al editar, el usuario conserva su cargo actual aunque ese cargo se haya desactivado.
async function resolverPersonal(empresa, datos, { profesionalActualId = null, cargoActual = null } = {}) {
  const perfil = await CategoriasService.perfilDeCategoria(empresa.categoriaId);
  const conservaCargo = cargoActual && datos.cargoId === cargoActual.id;
  const cargo = conservaCargo ? cargoActual : CategoriasService.exigirCargoDelPerfil(perfil, datos.cargoId);
  if (datos.esProfesional && !profesionalActualId && !CategoriasService.reservaPersonas(perfil.reserva)) {
    throw invalido(MSG.PROFESIONAL_NO_APLICA);
  }
  return { cargo, personal: { cargoId: cargo ? cargo.id : null, cargoObservacion: datos.cargoObservacion } };
}

// Tipo de acceso, rol y profesional del usuario según lo elegido en el formulario.
// El profesional es el que ya tenía (al editar), uno existente elegido, o uno nuevo si `esProfesional`.
// Un rol de alcance PROPIO (ej. Doctor) necesita profesional: es el dueño de las citas que verá.
async function resolverAcceso(organizacionId, datos, profesionalActualId = null) {
  const { esAdministrador: comoAdministrador, rolId, esProfesional } = datos;
  if (datos.profesionalId && !(await ProfesionalesRepository.buscarDeOrganizacion(datos.profesionalId, organizacionId))) {
    throw invalido(MSG.PROFESIONAL_NO_ENCONTRADO_EMPRESA);
  }
  const profesionalId = datos.profesionalId || profesionalActualId;
  const crearProfesional = Boolean(esProfesional) && !profesionalId;

  if (comoAdministrador) {
    const rol = await RolesRepository.buscarPlantillaPorCodigo(ROL_ADMIN_EMPRESA);
    if (!rol) throw new AppError(MSG.ROL_PLANTILLA_NO_ENCONTRADO, HTTP.ERROR_INTERNO);
    return { acceso: { tipoAcceso: TIPO_ACCESO.ADMIN_EMPRESA, rolId: rol.id, profesionalId }, crearProfesional };
  }

  const rol = await RolesRepository.buscarPorId(rolId);
  const asignable =
    rol && rol.activo && !esPlantillaAdmin(rol) && (rol.organizacionId === null || rol.organizacionId === organizacionId);
  if (!asignable) throw invalido(MSG.ROL_NO_ASIGNABLE);
  if (rol.alcance === ALCANCE_ROL.PROPIO && !profesionalId && !crearProfesional) {
    throw invalido(MSG.PROFESIONAL_REQUERIDO);
  }

  return { acceso: { tipoAcceso: TIPO_ACCESO.PERSONAL, rolId: rol.id, profesionalId }, crearProfesional };
}

// Crea (dentro de la transacción) el profesional de la persona si hace falta y devuelve el acceso final.
async function accesoConProfesional({ acceso, crearProfesional }, { organizacionId, persona, cargo, observacion }, tx) {
  if (!crearProfesional) return acceso;
  const profesional = await ProfesionalesService.crearDesdePersona(
    { organizacionId, persona, cargo: cargo ? cargo.nombre : null, observacion },
    tx
  );
  return { ...acceso, profesionalId: profesional.id };
}

// Envía la clave por correo. Si no hay proveedor de correo, la clave vuelve al administrador
// (una sola vez) para que se la entregue al usuario.
async function entregarClave(plantilla, para, clave) {
  const { enviado } = await CorreoService.enviar({ para, ...plantilla });
  return { correoEnviado: enviado, claveTemporal: enviado ? null : clave };
}

async function crear(actor, datos) {
  const empresa = await empresaDe(actor, datos.organizacionId);
  const organizacionId = empresa.id;
  exigirPuedeTocarAdministrador(actor, datos.esAdministrador);
  if (await UsuariosRepository.buscarPorEmail(datos.email)) {
    throw new AppError(MSG.CORREO_YA_REGISTRADO, HTTP.CONFLICTO);
  }

  const { cargo, personal } = await resolverPersonal(empresa, datos);
  const resuelto = await resolverAcceso(organizacionId, datos);
  const clave = generarClaveTemporal();
  const passwordHash = await hashear(clave);

  let creado;
  try {
    creado = await prisma.$transaction(async (tx) => {
      const persona = await PersonasRepository.crear(
        {
          tipoIdentificacion: datos.tipoIdentificacion,
          identificacion: datos.identificacion,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          telefono: datos.telefono,
          email: datos.email
        },
        tx
      );
      const acceso = await accesoConProfesional(
        resuelto,
        { organizacionId, persona: datos, cargo, observacion: datos.cargoObservacion },
        tx
      );
      return UsuariosRepository.crear(
        {
          personaId: persona.id,
          email: datos.email,
          passwordHash,
          organizacionId,
          creadoPorId: actor.id,
          activo: true,
          esClaveTemporal: true,
          ...personal,
          ...acceso
        },
        tx
      );
    }, TRANSACCION_OPCIONES);
  } catch (error) {
    throw traducirErrorUnico(error);
  }

  const entrega = await entregarClave(
    plantillasCorreo.bienvenida({ nombre: datos.nombres, empresa: empresa.nombre, email: datos.email, clave }),
    datos.email,
    clave
  );
  return { usuario: await UsuariosRepository.buscarDeOrganizacion(creado.id, organizacionId), ...entrega };
}

async function exigirUsuarioDeEmpresa(usuarioId, organizacionId) {
  const usuario = await UsuariosRepository.buscarDeOrganizacion(usuarioId, organizacionId);
  if (!usuario) throw new AppError(MSG.USUARIO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  return usuario;
}

async function editar(actor, datos) {
  const empresa = await empresaDe(actor, datos.organizacionId);
  const organizacionId = empresa.id;
  const objetivo = await exigirUsuarioDeEmpresa(datos.usuarioId, organizacionId);
  exigirPuedeTocarAdministrador(actor, datos.esAdministrador || objetivo.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA);

  const mismoRol =
    datos.esAdministrador === esAdministrador(objetivo) && (datos.esAdministrador || datos.rolId === objetivo.rolId);
  // Nadie cambia su propio rol: evita quedarse sin acceso por error.
  if (objetivo.id === actor.id && !mismoRol) throw invalido(MSG.USUARIO_PROPIO);

  const { cargo, personal } = await resolverPersonal(empresa, datos, {
    profesionalActualId: objetivo.profesionalId,
    cargoActual: objetivo.cargo
  });
  const resuelto = await resolverAcceso(organizacionId, datos, objetivo.profesionalId);

  try {
    await prisma.$transaction(async (tx) => {
      await PersonasRepository.actualizar(
        objetivo.personaId,
        {
          tipoIdentificacion: datos.tipoIdentificacion,
          identificacion: datos.identificacion,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          telefono: datos.telefono
        },
        tx
      );
      const acceso = await accesoConProfesional(
        resuelto,
        { organizacionId, persona: { ...datos, email: objetivo.email }, cargo, observacion: datos.cargoObservacion },
        tx
      );
      await UsuariosRepository.actualizar(objetivo.id, { ...personal, ...acceso }, tx);
    }, TRANSACCION_OPCIONES);
  } catch (error) {
    throw traducirErrorUnico(error);
  }

  return { usuario: await UsuariosRepository.buscarDeOrganizacion(objetivo.id, organizacionId) };
}

const guardar = (actor, datos) => (datos.usuarioId ? editar(actor, datos) : crear(actor, datos));

async function cambiarEstado(actor, { organizacionId: elegida, usuarioId, activo }) {
  const { id: organizacionId } = await empresaDe(actor, elegida);
  const objetivo = await exigirUsuarioDeEmpresa(usuarioId, organizacionId);
  if (objetivo.id === actor.id) throw invalido(MSG.USUARIO_PROPIO);
  exigirPuedeTocarAdministrador(actor, objetivo.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA);

  await UsuariosRepository.actualizar(objetivo.id, { activo });
  if (!activo) await RefreshTokensRepository.revocarDeUsuario(objetivo.id);
  return { usuario: await UsuariosRepository.buscarDeOrganizacion(objetivo.id, organizacionId) };
}

// Nueva clave temporal: cierra sus sesiones abiertas y desbloquea la cuenta.
async function restablecerClave(actor, { organizacionId: elegida, usuarioId }) {
  const { id: organizacionId } = await empresaDe(actor, elegida);
  const objetivo = await exigirUsuarioDeEmpresa(usuarioId, organizacionId);
  exigirPuedeTocarAdministrador(actor, objetivo.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA);

  const clave = generarClaveTemporal();
  await UsuariosRepository.actualizar(objetivo.id, {
    passwordHash: await hashear(clave),
    esClaveTemporal: true,
    intentosFallidos: 0,
    bloqueadoHasta: null
  });
  await RefreshTokensRepository.revocarDeUsuario(objetivo.id);

  const entrega = await entregarClave(
    plantillasCorreo.claveRestablecida({ nombre: objetivo.persona.nombres, clave }),
    objetivo.email,
    clave
  );
  return { usuario: await UsuariosRepository.buscarDeOrganizacion(objetivo.id, organizacionId), ...entrega };
}

module.exports = { consultar, guardar, cambiarEstado, restablecerClave };
