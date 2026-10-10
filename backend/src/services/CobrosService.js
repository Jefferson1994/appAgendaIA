const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, CATALOGOS, TIPOS_DOCUMENTO, TIPOS_MEDIO_COBRO } = require('../config/constantes');
const CatalogosRepository = require('../repositories/CatalogosRepository');
const MediosCobroRepository = require('../repositories/MediosCobroRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const CatalogosService = require('./CatalogosService');
const DocumentosService = require('./DocumentosService');

const invalido = (mensaje) => new AppError(mensaje, HTTP.PETICION_INVALIDA);

// Dónde se le paga a la empresa o a sus profesionales. La empresa siempre sale del usuario.

function empresaDe(actor) {
  if (!actor.organizacionId) throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
  return actor.organizacionId;
}

function profesionalDe(actor) {
  if (!actor.organizacionId || !actor.profesionalId) throw new AppError(MSG.SOLO_PROFESIONALES, HTTP.PROHIBIDO);
  return actor.profesionalId;
}

// Bancos, billeteras y tipos de cuenta para los formularios.
async function opciones() {
  const [bancos, billeteras, tiposCuenta] = await Promise.all([
    CatalogosRepository.listarItemsActivos(CATALOGOS.BANCOS),
    CatalogosRepository.listarItemsActivos(CATALOGOS.BILLETERAS),
    CatalogosRepository.listarItemsActivos(CATALOGOS.TIPOS_CUENTA)
  ]);
  return { bancos, billeteras, tiposCuenta };
}

async function politicaDe(organizacionId) {
  const empresa = await OrganizacionesRepository.buscarActivaPorId(organizacionId);
  if (!empresa) throw new AppError(MSG.ORGANIZACION_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);
  return empresa.cobroPorProfesional;
}

// ---------- Administrador de la empresa ----------

async function consultarEmpresa(actor) {
  const organizacionId = empresaDe(actor);
  const [cobroPorProfesional, medios, mediosProfesionales, listas] = await Promise.all([
    politicaDe(organizacionId),
    MediosCobroRepository.listarDe({ organizacionId, profesionalId: null }),
    MediosCobroRepository.listarDeProfesionales(organizacionId),
    opciones()
  ]);
  return { cobroPorProfesional, medios, mediosProfesionales, opciones: listas };
}

async function guardarPolitica(actor, { cobroPorProfesional }) {
  const organizacionId = empresaDe(actor);
  await OrganizacionesRepository.actualizar(organizacionId, { cobroPorProfesional });
  return consultarEmpresa(actor);
}

// ---------- Validación y guardado común (empresa o profesional) ----------

// Transferencia: un banco y su tipo de cuenta. Billetera: una billetera, sin tipo de cuenta.
async function resolverDatos(organizacionId, datos) {
  const esTransferencia = datos.tipo === TIPOS_MEDIO_COBRO.TRANSFERENCIA;
  const entidad = await CatalogosService.itemActivoDe(
    esTransferencia ? CATALOGOS.BANCOS : CATALOGOS.BILLETERAS,
    datos.entidadId
  );
  if (!entidad) throw invalido(MSG.MEDIO_COBRO_ENTIDAD_INVALIDA);

  let tipoCuentaId = null;
  if (esTransferencia) {
    const tipoCuenta = await CatalogosService.itemActivoDe(CATALOGOS.TIPOS_CUENTA, datos.tipoCuentaId);
    if (!tipoCuenta) throw invalido(MSG.MEDIO_COBRO_TIPO_CUENTA_REQUERIDO);
    tipoCuentaId = tipoCuenta.id;
  }

  if (
    datos.qrDocumentoId &&
    !(await DocumentosService.documentoDeEmpresa(datos.qrDocumentoId, organizacionId, TIPOS_DOCUMENTO.QR_COBRO))
  ) {
    throw invalido(MSG.MEDIO_COBRO_QR_INVALIDO);
  }

  return {
    tipo: datos.tipo,
    entidadId: entidad.id,
    tipoCuentaId,
    numero: datos.numero,
    titular: datos.titular,
    identificacionTitular: datos.identificacionTitular,
    alias: datos.alias,
    qrDocumentoId: datos.qrDocumentoId,
    orden: datos.orden
  };
}

async function guardarDe(duenio, { medioId, ...datos }) {
  const campos = await resolverDatos(duenio.organizacionId, datos);
  if (!medioId) return MediosCobroRepository.crear({ ...duenio, ...campos });

  if (!(await MediosCobroRepository.buscarDe(medioId, duenio))) {
    throw new AppError(MSG.MEDIO_COBRO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return MediosCobroRepository.actualizar(medioId, campos);
}

async function cambiarEstadoDe(duenio, { medioId, activo }) {
  if (!(await MediosCobroRepository.buscarDe(medioId, duenio))) {
    throw new AppError(MSG.MEDIO_COBRO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return MediosCobroRepository.actualizar(medioId, { activo });
}

const duenioEmpresa = (actor) => ({ organizacionId: empresaDe(actor), profesionalId: null });
const duenioProfesional = (actor) => ({ organizacionId: empresaDe(actor), profesionalId: profesionalDe(actor) });

// ---------- El profesional: sus propias cuentas ----------

async function consultarMios(actor) {
  const duenio = duenioProfesional(actor);
  const [cobroPorProfesional, medios, listas] = await Promise.all([
    politicaDe(duenio.organizacionId),
    MediosCobroRepository.listarDe(duenio),
    opciones()
  ]);
  return { cobroPorProfesional, medios, opciones: listas };
}

// ---------- Para el bot: dónde paga el cliente de un canal ----------

// Si la empresa cobra por profesional y él tiene medios activos, se usan los suyos;
// si no, los de la empresa.
async function mediosParaCanal(canal) {
  const { organizacionId, profesionalId } = canal;
  if (canal.organizacion.cobroPorProfesional) {
    const propios = await MediosCobroRepository.listarActivosDe({ organizacionId, profesionalId });
    if (propios.length > 0) return propios;
  }
  return MediosCobroRepository.listarActivosDe({ organizacionId, profesionalId: null });
}

module.exports = {
  consultarEmpresa,
  guardarPolitica,
  guardarMedioEmpresa: (actor, datos) => guardarDe(duenioEmpresa(actor), datos),
  cambiarEstadoMedioEmpresa: (actor, datos) => cambiarEstadoDe(duenioEmpresa(actor), datos),
  consultarMios,
  guardarMio: (actor, datos) => guardarDe(duenioProfesional(actor), datos),
  cambiarEstadoMio: (actor, datos) => cambiarEstadoDe(duenioProfesional(actor), datos),
  mediosParaCanal
};
