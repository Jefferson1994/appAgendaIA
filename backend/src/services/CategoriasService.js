const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TIPOS_RESERVA } = require('../config/constantes');
const CategoriasEmpresaRepository = require('../repositories/CategoriasEmpresaRepository');
const CargosRepository = require('../repositories/CargosRepository');

const ERROR_UNICO_PRISMA = 'P2002';

const invalido = (mensaje) => new AppError(mensaje, HTTP.PETICION_INVALIDA);

// En el negocio se reservan personas (profesionales con agenda propia).
const reservaPersonas = (reserva) => reserva === TIPOS_RESERVA.PERSONAS || reserva === TIPOS_RESERVA.AMBOS;

function traducirDuplicado(error, mensaje) {
  if (error && error.code === ERROR_UNICO_PRISMA) return new AppError(mensaje, HTTP.CONFLICTO);
  return error;
}

// ---------- Pantalla del super admin ----------

async function consultar() {
  const [categorias, cargos] = await Promise.all([CategoriasEmpresaRepository.listar(), CargosRepository.listar()]);
  return { categorias, cargos };
}

async function exigirCategoria(id) {
  const categoria = await CategoriasEmpresaRepository.buscarPorId(id);
  if (!categoria) throw new AppError(MSG.CATEGORIA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
  return categoria;
}

// Solo dos niveles: el padre debe ser una categoría general, y una categoría con
// subcategorías no puede pasar a ser subcategoría de otra.
async function validarPadre(categoriaId, padreId) {
  if (!padreId) return;
  const padre = await CategoriasEmpresaRepository.buscarPorId(padreId);
  if (!padre || padre.padreId !== null || padre.id === categoriaId) throw invalido(MSG.CATEGORIA_PADRE_INVALIDA);
  if (categoriaId && (await CategoriasEmpresaRepository.contarSubcategorias(categoriaId)) > 0) {
    throw invalido(MSG.CATEGORIA_CON_SUBCATEGORIAS);
  }
}

async function guardarCategoria({ categoriaId, codigo, ...datos }) {
  if (categoriaId) await exigirCategoria(categoriaId);
  await validarPadre(categoriaId, datos.padreId);

  try {
    return categoriaId
      ? await CategoriasEmpresaRepository.actualizar(categoriaId, datos)
      : await CategoriasEmpresaRepository.crear({ codigo, ...datos });
  } catch (error) {
    throw traducirDuplicado(error, MSG.CATEGORIA_CODIGO_DUPLICADO);
  }
}

// Una categoría inactiva ya no se ofrece en el registro; las empresas que la tienen la conservan.
async function cambiarEstadoCategoria({ categoriaId, activo }) {
  await exigirCategoria(categoriaId);
  return CategoriasEmpresaRepository.actualizar(categoriaId, { activo });
}

async function guardarCargo({ cargoId, codigo, ...datos }) {
  await exigirCategoria(datos.categoriaId);
  if (cargoId && !(await CargosRepository.buscarPorId(cargoId))) {
    throw new AppError(MSG.CARGO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }

  try {
    return cargoId ? await CargosRepository.actualizar(cargoId, datos) : await CargosRepository.crear({ codigo, ...datos });
  } catch (error) {
    throw traducirDuplicado(error, MSG.CARGO_CODIGO_DUPLICADO);
  }
}

async function cambiarEstadoCargo({ cargoId, activo }) {
  if (!(await CargosRepository.buscarPorId(cargoId))) throw new AppError(MSG.CARGO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  return CargosRepository.actualizar(cargoId, { activo });
}

// ---------- Uso desde el registro y los usuarios ----------

// Catálogo público del registro: categorías generales con sus subcategorías y cargos.
function catalogoPublico() {
  return CategoriasEmpresaRepository.listarActivasConCargos();
}

// Qué se reserva en una empresa y qué cargos puede tener su personal (los de su subcategoría
// y los de su categoría general). Empresas anteriores a las categorías: reservan personas, sin cargos.
async function perfilDeCategoria(categoriaId) {
  if (!categoriaId) return { reserva: TIPOS_RESERVA.PERSONAS, cargos: [] };

  const categoria = await CategoriasEmpresaRepository.buscarPorId(categoriaId);
  if (!categoria) return { reserva: TIPOS_RESERVA.PERSONAS, cargos: [] };

  const ids = [categoria.id, categoria.padreId].filter(Boolean);
  return { reserva: categoria.reserva, cargos: await CargosRepository.listarActivosDeCategorias(ids) };
}

// El registro solo acepta una subcategoría activa cuya categoría general también esté activa.
async function exigirSubcategoriaParaRegistro(categoriaId) {
  const categoria = await CategoriasEmpresaRepository.buscarPorId(categoriaId);
  const valida = categoria && categoria.activo && categoria.padre && categoria.padre.activo;
  if (!valida) throw invalido(MSG.CATEGORIA_REGISTRO_INVALIDA);
  return perfilDeCategoria(categoriaId);
}

// Cargo elegido para una persona: debe estar entre los del perfil de la empresa.
function exigirCargoDelPerfil(perfil, cargoId) {
  if (!cargoId) return null;
  const cargo = perfil.cargos.find((item) => item.id === cargoId);
  if (!cargo) throw invalido(MSG.CARGO_NO_ASIGNABLE);
  return cargo;
}

module.exports = {
  reservaPersonas,
  consultar,
  guardarCategoria,
  cambiarEstadoCategoria,
  guardarCargo,
  cambiarEstadoCargo,
  catalogoPublico,
  perfilDeCategoria,
  exigirSubcategoriaParaRegistro,
  exigirCargoDelPerfil
};
