const crypto = require('crypto');
const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TIPO_ACCESO, TRANSACCION_OPCIONES } = require('../config/constantes');
const proveedor = require('../security/proveedores');
const { hashear } = require('../security/passwords');
const SesionEB = require('../eb/SesionEB');
const UsuarioEB = require('../eb/UsuarioEB');
const UsuariosRepository = require('../repositories/UsuariosRepository');
const PersonasRepository = require('../repositories/PersonasRepository');
const RolesRepository = require('../repositories/RolesRepository');
const AccesoService = require('./AccesoService');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');

// Código de la plantilla de rol que recibe el administrador de una empresa nueva.
const ROL_ADMIN_EMPRESA = TIPO_ACCESO.ADMIN_EMPRESA;
const CODIGO_ORG_MAX_BASE = 40;
const ERROR_UNICO_PRISMA = 'P2002';

async function describirUsuario(usuario) {
  return new UsuarioEB(usuario, await AccesoService.obtenerAcceso(usuario));
}

async function describirUsuario(usuario) {
  return new UsuarioEB(usuario, await AccesoService.obtenerAcceso(usuario));
}

// La identidad la entrega el proveedor; la autorización siempre sale de nuestra base.
async function cargarUsuario(identidad) {
  const usuario = identidad.usuarioId
    ? await UsuariosRepository.buscarConAcceso(identidad.usuarioId)
    : null;

  if (!usuario || !usuario.activo) {
    throw new AppError(MSG.TOKEN_INVALIDO, HTTP.NO_AUTORIZADO);
  }
  return usuario;
}

async function construirSesion(identidad) {
  const usuario = await cargarUsuario(identidad);
  return new SesionEB(identidad.tokens, usuario, await AccesoService.obtenerAcceso(usuario));
}

async function login({ email, password }, contexto) {
  const identidad = await proveedor.autenticar({ email, password, ...contexto });
  return construirSesion(identidad);
}

async function refrescar({ refreshToken }, contexto) {
  const identidad = await proveedor.refrescar({ refreshToken, ...contexto });
  return construirSesion(identidad);
}

async function cerrarSesion({ refreshToken }) {
  await proveedor.cerrarSesion({ refreshToken });
}

async function exigirCorreoLibre(email) {
  const existente = await UsuariosRepository.buscarPorEmail(email);
  if (existente) {
    throw new AppError(MSG.CORREO_YA_REGISTRADO, HTTP.CONFLICTO);
  }
}

// Si dos registros llegan a la vez con el mismo dato único, la base rechaza el segundo.
function traducirErrorUnico(error) {
  if (!error || error.code !== ERROR_UNICO_PRISMA) {
    return error;
  }

  const campos = String((error.meta && error.meta.target) || '');
  if (campos.includes('ruc')) {
    return new AppError(MSG.RUC_YA_REGISTRADO, HTTP.CONFLICTO);
  }
  if (campos.includes('identificacion')) {
    return new AppError(MSG.IDENTIFICACION_YA_REGISTRADA, HTTP.CONFLICTO);
  }
  return new AppError(MSG.CORREO_YA_REGISTRADO, HTTP.CONFLICTO);
}

function generarCodigoOrganizacion(nombre) {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CODIGO_ORG_MAX_BASE);

  return `${base || 'org'}-${crypto.randomBytes(3).toString('hex')}`;
}

// Persona (representante), organización y usuario administrador, todo o nada.
async function registrarEmpresa({ administrador, organizacion }, contexto) {
  await exigirCorreoLibre(administrador.email);

  const rol = await RolesRepository.buscarPlantillaPorCodigo(ROL_ADMIN_EMPRESA);
  if (!rol) {
    throw new AppError(MSG.ROL_PLANTILLA_NO_ENCONTRADO, HTTP.ERROR_INTERNO);
  }

  const passwordHash = await hashear(administrador.password);
  const { zonaHoraria, ...datosOrganizacion } = organizacion;

  try {
    await prisma.$transaction(async (tx) => {
      const persona = await PersonasRepository.crear(
        {
          tipoIdentificacion: administrador.tipoIdentificacion,
          identificacion: administrador.identificacion,
          nombres: administrador.nombres,
          apellidos: administrador.apellidos,
          telefono: administrador.telefono,
          email: administrador.email
        },
        tx
      );

      const creada = await OrganizacionesRepository.crear(
        {
          ...datosOrganizacion,
          codigo: generarCodigoOrganizacion(organizacion.nombre),
          representanteId: persona.id,
          ...(zonaHoraria ? { zonaHoraria } : {})
        },
        tx
      );

      await UsuariosRepository.crear(
        {
          personaId: persona.id,
          email: administrador.email,
          passwordHash,
          tipoAcceso: TIPO_ACCESO.ADMIN_EMPRESA,
          organizacionId: creada.id,
          rolId: rol.id,
          activo: true
        },
        tx
      );
    }, TRANSACCION_OPCIONES);
  } catch (error) {
    throw traducirErrorUnico(error);
  }

  return login({ email: administrador.email, password: administrador.password }, contexto);
}

module.exports = {
  describirUsuario,
  login,
  refrescar,
  cerrarSesion,
  registrarEmpresa
};