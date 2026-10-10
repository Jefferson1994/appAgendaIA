const CanalesService = require('../services/CanalesService');
const CobrosService = require('../services/CobrosService');
const DocumentosService = require('../services/DocumentosService');
const MediosCobroRepository = require('../repositories/MediosCobroRepository');
const MediosCobroCanalEB = require('../eb/MediosCobroCanalEB');
const { enviarArchivo } = require('./DocumentosController');
const ContextoPaths = require('../routes/paths/ContextoPaths');
const AppError = require('../errors/AppError');
const { HTTP } = require('../config/constantes');
const { validarIdPositivo } = require('../utils/validaciones');
const ServiciosService = require('../services/ServiciosService');
const ContextoRequest = require('../dto/request/ContextoRequest');
const ContextoEB = require('../eb/ContextoEB');
const ServicioEB = require('../eb/ServicioEB');
const MSG = require('../config/mensajes');
const { ok } = require('../utils/respuesta');

async function resolverPorCanal(req, res) {
  const { identificador } = ContextoRequest.validarCanal(req.params);
  const canal = await CanalesService.resolverCanalActivo(identificador);
  const { relaciones } = await ServiciosService.listarPorCanal(identificador);
  const servicios = relaciones.map((relacion) => new ServicioEB(relacion, canal.profesional));

  return ok(res, new ContextoEB(canal, servicios), MSG.CONTEXTO_OK);
}

// Ruta del QR de un medio, relativa al backend, para que el bot la descargue.
const rutaQr = (identificador, medioId) =>
  `${ContextoPaths.BASE}${ContextoPaths.QR_MEDIO_COBRO.replace(':identificador', encodeURIComponent(identificador)).replace(
    ':medioId',
    medioId
  )}`;

// Medios de cobro que el bot ofrece al cliente del canal, según la política de la empresa.
async function mediosCobro(req, res) {
  const { identificador } = ContextoRequest.validarCanal(req.params);
  const canal = await CanalesService.resolverCanalActivo(identificador);
  const medios = await CobrosService.mediosParaCanal(canal);
  return ok(res, new MediosCobroCanalEB(medios, { identificador, rutaQr }), MSG.COBROS_OK);
}

// Imagen del QR de un medio de la empresa del canal.
async function qrMedioCobro(req, res) {
  const { identificador } = ContextoRequest.validarCanal(req.params);
  const medioId = validarIdPositivo(req.params.medioId, 'medioId');
  const canal = await CanalesService.resolverCanalActivo(identificador);
  const medio = await MediosCobroRepository.buscarActivoDeEmpresa(medioId, canal.organizacionId);
  if (!medio || !medio.qrDocumento || !medio.qrDocumento.activo) {
    throw new AppError(MSG.DOCUMENTO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return enviarArchivo(res, await DocumentosService.leerContenido(medio.qrDocumento));
}

module.exports = { resolverPorCanal, mediosCobro, qrMedioCobro };
