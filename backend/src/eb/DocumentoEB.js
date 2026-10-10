// Metadatos de un archivo subido. Nunca incluye la ruta interna del almacenamiento:
// el contenido se pide a GET /documentos/:id/archivo.
class DocumentoEB {
  constructor(documento) {
    this.Id = documento.id;
    this.Tipo = documento.tipo ? { Codigo: documento.tipo.codigo, Nombre: documento.tipo.nombre } : null;
    this.NombreOriginal = documento.nombreOriginal;
    this.MimeType = documento.mimeType;
    this.TamanoBytes = documento.tamanoBytes;
    this.FechaCreacion = documento.fechaCreacion;
  }
}

module.exports = DocumentoEB;
