const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP } = require('../../config/constantes');

// Único punto de acceso a los archivos. Hoy usa el filer de SeaweedFS por HTTP
// (SEAWEED_FILER_URL en el .env); para otro almacenamiento (S3, disco) basta otra
// implementación con este mismo contrato: guardar, leer y eliminar por `ruta`.
//
// El filer nunca se expone al navegador: el backend lee el archivo y lo entrega
// después de validar quién lo pide.

const TIMEOUT_MS = 20000;

function urlDe(ruta) {
  const base = (process.env.SEAWEED_FILER_URL || '').replace(/\/+$/, '');
  if (!base) throw new AppError(MSG.ALMACENAMIENTO_NO_DISPONIBLE, HTTP.ERROR_INTERNO);
  // Cada segmento se codifica por separado para conservar las barras de la ruta.
  return `${base}/${ruta.split('/').map(encodeURIComponent).join('/')}`;
}

async function pedir(url, opciones) {
  try {
    return await fetch(url, { ...opciones, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new AppError(MSG.ALMACENAMIENTO_NO_DISPONIBLE, HTTP.ERROR_INTERNO);
  }
}

/** Guarda el contenido en `ruta` (la ruta incluye carpetas y nombre del archivo). */
async function guardar(ruta, contenido, mimeType) {
  const formulario = new FormData();
  formulario.append('file', new Blob([contenido], { type: mimeType }), ruta.split('/').pop());

  const respuesta = await pedir(urlDe(ruta), { method: 'POST', body: formulario });
  if (!respuesta.ok) throw new AppError(MSG.ALMACENAMIENTO_NO_DISPONIBLE, HTTP.ERROR_INTERNO);
}

/** @returns Buffer con el contenido, o null si el archivo no existe en el almacenamiento. */
async function leer(ruta) {
  const respuesta = await pedir(urlDe(ruta), { method: 'GET' });
  if (respuesta.status === HTTP.NO_ENCONTRADO) return null;
  if (!respuesta.ok) throw new AppError(MSG.ALMACENAMIENTO_NO_DISPONIBLE, HTTP.ERROR_INTERNO);
  return Buffer.from(await respuesta.arrayBuffer());
}

/** Borra el archivo; si ya no existe no es error. */
async function eliminar(ruta) {
  const respuesta = await pedir(urlDe(ruta), { method: 'DELETE' });
  if (!respuesta.ok && respuesta.status !== HTTP.NO_ENCONTRADO) {
    throw new AppError(MSG.ALMACENAMIENTO_NO_DISPONIBLE, HTTP.ERROR_INTERNO);
  }
}

module.exports = { guardar, leer, eliminar };
