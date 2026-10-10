const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, FORMATOS_ACCESO, TRANSACCION_OPCIONES } = require('../config/constantes');
const { PERMISOS, CODIGOS_DEL_SISTEMA } = require('../config/permisos');
const AccionesRepository = require('../repositories/AccionesRepository');
const ModulosRepository = require('../repositories/ModulosRepository');
const PantallasRepository = require('../repositories/PantallasRepository');
const PermisosRepository = require('../repositories/PermisosRepository');

const ERROR_UNICO_PRISMA = 'P2002';

const noEncontrado = (mensaje) => new AppError(mensaje, HTTP.NO_ENCONTRADO);
const conflicto = (mensaje) => new AppError(mensaje, HTTP.CONFLICTO);

// Traduce el error de código duplicado de Prisma a un mensaje claro.
async function conCodigoUnico(operacion, mensajeDuplicado) {
  try {
    return await operacion();
  } catch (error) {
    if (error && error.code === ERROR_UNICO_PRISMA) {
      throw conflicto(mensajeDuplicado);
    }
    throw error;
  }
}

// La pantalla de esta configuración es la que tiene el botón modulos.gestionar.
// Ni ella ni su módulo se pueden desactivar: el super admin perdería el acceso para reactivarlos.
async function ubicacionProtegida() {
  const permiso = await PermisosRepository.buscarPorCodigo(PERMISOS.MODULOS_GESTIONAR);
  const pantalla = permiso && permiso.pantalla;
  return { pantallaId: pantalla ? pantalla.id : null, moduloId: pantalla ? pantalla.moduloId : null };
}

async function exigirModulo(moduloId) {
  const modulo = await ModulosRepository.buscarPorId(moduloId);
  if (!modulo) throw noEncontrado(MSG.MODULO_NO_ENCONTRADO);
  return modulo;
}

async function exigirPantalla(pantallaId) {
  const pantalla = await PantallasRepository.buscarPorId(pantallaId);
  if (!pantalla) throw noEncontrado(MSG.PANTALLA_NO_ENCONTRADA);
  return pantalla;
}

async function exigirBoton(botonId) {
  const boton = await PermisosRepository.buscarPorId(botonId);
  if (!boton) throw noEncontrado(MSG.BOTON_NO_ENCONTRADO);
  return boton;
}

// Dos pantallas con la misma ruta harían que el front abra siempre la primera.
async function exigirRutaLibre(ruta, pantallaId) {
  const existente = await PantallasRepository.buscarPorRuta(ruta);
  if (existente && existente.id !== pantallaId) {
    throw conflicto(MSG.PANTALLA_RUTA_DUPLICADA);
  }
}

// Árbol completo para la pantalla de configuración y el catálogo de acciones disponibles.
async function consultar() {
  const [modulos, acciones] = await Promise.all([
    ModulosRepository.listarConPantallasYBotones(),
    AccionesRepository.listarActivas()
  ]);
  return { modulos, acciones };
}

async function guardarModulo({ moduloId, codigo, ...datos }) {
  if (moduloId) {
    await exigirModulo(moduloId);
    await ModulosRepository.actualizar(moduloId, datos);
    return ModulosRepository.buscarConPantallasYBotones(moduloId);
  }

  const creado = await conCodigoUnico(
    () => ModulosRepository.crear({ codigo, ...datos }),
    MSG.MODULO_CODIGO_DUPLICADO
  );
  return ModulosRepository.buscarConPantallasYBotones(creado.id);
}

async function cambiarEstadoModulo({ moduloId, activo }) {
  await exigirModulo(moduloId);
  if (!activo && (await ubicacionProtegida()).moduloId === moduloId) {
    throw conflicto(MSG.MODULO_PROTEGIDO);
  }

  await ModulosRepository.actualizar(moduloId, { activo });
  return ModulosRepository.buscarConPantallasYBotones(moduloId);
}

async function guardarPantalla({ pantallaId, codigo, ...datos }) {
  await exigirModulo(datos.moduloId);
  await exigirRutaLibre(datos.ruta, pantallaId);

  if (pantallaId) {
    await exigirPantalla(pantallaId);
    if (!datos.soloPlataforma && (await ubicacionProtegida()).pantallaId === pantallaId) {
      throw conflicto(MSG.PANTALLA_PROTEGIDA_PLATAFORMA);
    }
    await PantallasRepository.actualizar(pantallaId, datos);
    return PantallasRepository.buscarConBotones(pantallaId);
  }

  const creada = await conCodigoUnico(
    () => PantallasRepository.crear({ codigo, ...datos }),
    MSG.PANTALLA_CODIGO_DUPLICADO
  );
  return PantallasRepository.buscarConBotones(creada.id);
}

async function cambiarEstadoPantalla({ pantallaId, activo }) {
  await exigirPantalla(pantallaId);
  if (!activo && (await ubicacionProtegida()).pantallaId === pantallaId) {
    throw conflicto(MSG.PANTALLA_PROTEGIDA);
  }

  await PantallasRepository.actualizar(pantallaId, { activo });
  return PantallasRepository.buscarConBotones(pantallaId);
}

// Recurso del permiso a partir de la ruta: /historia-clinica -> historia_clinica.
function recursoDeRuta(ruta) {
  const recurso = ruta.replace(/^\/+/, '').replace(/-/g, '_');
  if (!FORMATOS_ACCESO.CODIGO_BOTON.test(`${recurso}.x`)) {
    throw new AppError(MSG.RUTA_SIN_RECURSO, HTTP.PETICION_INVALIDA);
  }
  return recurso;
}

// Código del permiso de un botón: <recurso>.<accion>, ej. historia_clinica.ver
const codigoDeBoton = (recurso, accion) => `${recurso}.${accion.codigo.toLowerCase()}`;

// Asigna acciones del catálogo a una pantalla. Por cada acción se crea su permiso,
// o se enlaza el que ya existía con ese código si todavía no era botón de otra pantalla.
// Las acciones que la pantalla ya tiene se ignoran.
async function asignarAcciones({ pantallaId, accionIds }) {
  const pantalla = await PantallasRepository.buscarConBotones(pantallaId);
  if (!pantalla) throw noEncontrado(MSG.PANTALLA_NO_ENCONTRADA);

  const acciones = await AccionesRepository.buscarActivasPorIds(accionIds);
  if (acciones.length !== accionIds.length) throw noEncontrado(MSG.ACCION_NO_ENCONTRADA);

  const yaAsignadas = new Set(pantalla.permisos.map((permiso) => permiso.accionId).filter(Boolean));
  const nuevas = acciones.filter((accion) => !yaAsignadas.has(accion.id));
  const recurso = recursoDeRuta(pantalla.ruta);

  await prisma.$transaction(async (tx) => {
    for (const accion of nuevas) {
      const codigo = codigoDeBoton(recurso, accion);
      const datos = {
        pantallaId: pantalla.id,
        accionId: accion.id,
        categoria: recurso,
        descripcion: MSG.DESCRIPCION_BOTON(accion.nombre, pantalla.nombre)
      };

      const existente = await PermisosRepository.buscarPorCodigo(codigo, tx);
      if (existente && existente.pantallaId && existente.pantallaId !== pantalla.id) {
        throw conflicto(MSG.BOTON_CODIGO_EN_OTRA_PANTALLA(codigo));
      }

      if (existente) {
        await PermisosRepository.actualizar(existente.id, datos, tx);
      } else {
        await PermisosRepository.crear({ codigo, ...datos }, tx);
      }
    }
  }, TRANSACCION_OPCIONES);

  return PantallasRepository.buscarConBotones(pantalla.id);
}

async function eliminarBoton({ botonId }) {
  const boton = await exigirBoton(botonId);

  if (CODIGOS_DEL_SISTEMA.has(boton.codigo)) {
    throw conflicto(MSG.BOTON_DEL_SISTEMA);
  }
  if (boton._count.roles > 0) {
    throw conflicto(MSG.BOTON_EN_USO(boton._count.roles));
  }

  await PermisosRepository.eliminar(botonId);
  return boton;
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
