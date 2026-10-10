const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const CatalogosRepository = require('../repositories/CatalogosRepository');

const ERROR_UNICO_PRISMA = 'P2002';

// Los catálogos (BANCOS, TIPOS_CUENTA...) los crea el seed porque el código los usa por su código;
// el super admin administra sus valores (items).

function consultar() {
  return CatalogosRepository.listarConItems();
}

async function guardarItem({ itemId, catalogoId, codigo, ...datos }) {
  if (!(await CatalogosRepository.buscarPorId(catalogoId))) {
    throw new AppError(MSG.CATALOGO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  if (itemId) {
    const actual = await CatalogosRepository.buscarItem(itemId);
    if (!actual || actual.catalogoId !== catalogoId) {
      throw new AppError(MSG.CATALOGO_ITEM_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
    }
  }

  try {
    return itemId
      ? await CatalogosRepository.actualizarItem(itemId, datos)
      : await CatalogosRepository.crearItem({ catalogoId, codigo, ...datos });
  } catch (error) {
    if (error && error.code === ERROR_UNICO_PRISMA) throw new AppError(MSG.CATALOGO_ITEM_DUPLICADO, HTTP.CONFLICTO);
    throw error;
  }
}

// Un valor inactivo ya no se ofrece, pero lo que ya lo usa lo conserva.
async function cambiarEstadoItem({ itemId, activo }) {
  if (!(await CatalogosRepository.buscarItem(itemId))) {
    throw new AppError(MSG.CATALOGO_ITEM_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return CatalogosRepository.actualizarItem(itemId, { activo });
}

/** Item activo de un catálogo concreto, o null (para validar lo que elige el usuario). */
async function itemActivoDe(codigoCatalogo, itemId) {
  if (!itemId) return null;
  const item = await CatalogosRepository.buscarItem(itemId);
  const valido = item && item.activo && item.catalogo.activo && item.catalogo.codigo === codigoCatalogo;
  return valido ? item : null;
}

module.exports = { consultar, guardarItem, cambiarEstadoItem, itemActivoDe };
