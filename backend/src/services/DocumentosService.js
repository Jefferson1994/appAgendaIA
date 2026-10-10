const crypto = require('crypto');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const {
  HTTP,
  TIPO_ACCESO,
  CATALOGOS,
  ARCHIVOS_PERMITIDOS,
  MIME_POR_TIPO_DOCUMENTO,
  LONGITUD_DOCUMENTOS
} = require('../config/constantes');
const AlmacenamientoService = require('./almacenamiento/AlmacenamientoService');
const CatalogosRepository = require('../repositories/CatalogosRepository');
const DocumentosRepository = require('../repositories/DocumentosRepository');

const CARPETA_PLATAFORMA = 'plataforma';
const CARPETA_RAIZ_DEFECTO = 'agendaia';

const invalido = (mensaje) => new AppError(mensaje, HTTP.PETICION_INVALIDA);

// El tipo real se decide por los primeros bytes, no por el nombre ni por lo que dice el navegador.
function exigirFormato(contenido, mimeDeclarado, permitidos) {
  const formato = ARCHIVOS_PERMITIDOS[mimeDeclarado];
  const coincide =
    formato && permitidos.includes(mimeDeclarado) && formato.firma.every((byte, indice) => contenido[indice] === byte);
  if (!coincide) throw invalido(MSG.DOCUMENTO_FORMATO_INVALIDO);
  return formato;
}

// Nombre original sin rutas ni caracteres de control, recortado al largo de la columna.
function limpiarNombre(nombre) {
  const base = String(nombre || 'archivo').split(/[\\/]/).pop();
  return base.replace(/[\u0000-\u001f]/g, '').slice(0, LONGITUD_DOCUMENTOS.NOMBRE_ORIGINAL) || 'archivo';
}

// carpeta-raíz/empresa-7/qr_cobro/2026/10/<uuid>.png
function construirRuta(organizacionId, tipoCodigo, extension) {
  const raiz = (process.env.ALMACENAMIENTO_CARPETA || CARPETA_RAIZ_DEFECTO).replace(/^\/+|\/+$/g, '');
  const ahora = new Date();
  const mes = String(ahora.getUTCMonth() + 1).padStart(2, '0');
  const duenio = organizacionId ? `empresa-${organizacionId}` : CARPETA_PLATAFORMA;
  return `${raiz}/${duenio}/${tipoCodigo.toLowerCase()}/${ahora.getUTCFullYear()}/${mes}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Sube un archivo y guarda sus metadatos. La empresa sale del usuario (el super admin sube a la plataforma).
 *
 * @param archivo `{ contenido: Buffer, mimeType, nombreOriginal }` ya recibido por el middleware.
 */
async function subir(actor, { tipoCodigo, archivo }) {
  if (!archivo || !archivo.contenido || archivo.contenido.length === 0) throw invalido(MSG.DOCUMENTO_REQUERIDO);

  const tipo = await CatalogosRepository.buscarItemPorCodigo(CATALOGOS.TIPOS_DOCUMENTO, tipoCodigo);
  const permitidos = MIME_POR_TIPO_DOCUMENTO[tipoCodigo];
  if (!tipo || !tipo.activo || !permitidos) throw invalido(MSG.DOCUMENTO_TIPO_INVALIDO);

  const formato = exigirFormato(archivo.contenido, archivo.mimeType, permitidos);
  const organizacionId = actor.organizacionId || null;
  const ruta = construirRuta(organizacionId, tipoCodigo, formato.extension);

  await AlmacenamientoService.guardar(ruta, archivo.contenido, archivo.mimeType);
  return DocumentosRepository.crear({
    organizacionId,
    tipoId: tipo.id,
    nombreOriginal: limpiarNombre(archivo.nombreOriginal),
    mimeType: archivo.mimeType,
    tamanoBytes: archivo.contenido.length,
    ruta,
    hash: crypto.createHash('sha256').update(archivo.contenido).digest('hex'),
    subidoPorId: actor.id
  });
}

// Cada empresa solo ve sus archivos; el super admin, todos.
function puedeVer(actor, documento) {
  return actor.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN || documento.organizacionId === actor.organizacionId;
}

async function leerContenido(documento) {
  const contenido = await AlmacenamientoService.leer(documento.ruta);
  if (!contenido) throw new AppError(MSG.DOCUMENTO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  return { documento, contenido };
}

/** @returns `{ documento, contenido }` si el usuario puede verlo. */
async function obtenerArchivo(actor, documentoId) {
  const documento = await DocumentosRepository.buscarActivo(documentoId);
  if (!documento || !puedeVer(actor, documento)) throw new AppError(MSG.DOCUMENTO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  return leerContenido(documento);
}

/** Documento activo de una empresa y de un tipo, o null (para validar lo que se enlaza a otra tabla). */
async function documentoDeEmpresa(documentoId, organizacionId, tipoCodigo) {
  if (!documentoId) return null;
  const documento = await DocumentosRepository.buscarActivo(documentoId);
  const valido = documento && documento.organizacionId === organizacionId && documento.tipo.codigo === tipoCodigo;
  return valido ? documento : null;
}

module.exports = { subir, obtenerArchivo, leerContenido, documentoDeEmpresa };
