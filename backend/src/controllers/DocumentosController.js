const DocumentosService = require('../services/DocumentosService');
const DocumentosRequest = require('../dto/request/DocumentosRequest');
const DocumentoEB = require('../eb/DocumentoEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

async function subir(req, res) {
  const datos = DocumentosRequest.validarSubida(req.body, req.file);
  const documento = await DocumentosService.subir(req.usuario, datos);
  return ok(res, new DocumentoEB(documento), MSG.DOCUMENTO_SUBIDO, HTTP.CREADO);
}

// Entrega el archivo con su tipo; `inline` para que el navegador lo muestre (imagen o PDF).
function enviarArchivo(res, { documento, contenido }) {
  res.set({
    'Content-Type': documento.mimeType,
    'Content-Length': contenido.length,
    'Content-Disposition': `inline; filename="${encodeURIComponent(documento.nombreOriginal)}"`,
    'Cache-Control': 'private, max-age=300',
    'X-Content-Type-Options': 'nosniff'
  });
  return res.send(contenido);
}

async function archivo(req, res) {
  const { documentoId } = DocumentosRequest.validarDocumentoId(req.params);
  return enviarArchivo(res, await DocumentosService.obtenerArchivo(req.usuario, documentoId));
}

module.exports = { subir, archivo, enviarArchivo };
