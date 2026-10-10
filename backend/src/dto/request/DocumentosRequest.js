const { FORMATOS_ACCESO, LONGITUD_CATALOGOS } = require('../../config/constantes');
const { validarIdPositivo, validarFormato } = require('../../utils/validaciones');

// POST /documentos/subir (multipart): campo `tipo` = código del tipo de documento (QR_COBRO...).
// El archivo lo deja el middleware en req.file.
function validarSubida(body = {}, archivo = null) {
  return {
    tipoCodigo: validarFormato(body.tipo, 'tipo', FORMATOS_ACCESO.CODIGO, LONGITUD_CATALOGOS.CODIGO),
    archivo: archivo
      ? { contenido: archivo.buffer, mimeType: archivo.mimetype, nombreOriginal: archivo.originalname }
      : null
  };
}

// GET /documentos/:id/archivo
function validarDocumentoId(params = {}) {
  return { documentoId: validarIdPositivo(params.id, 'id') };
}

module.exports = { validarSubida, validarDocumentoId };
