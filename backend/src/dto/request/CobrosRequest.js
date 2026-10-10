const { ORDEN_ACCESO, TIPOS_MEDIO_COBRO, LONGITUD_COBROS } = require('../../config/constantes');
const {
  validarIdPositivo,
  validarIdOpcional,
  validarTexto,
  validarTextoOpcional,
  validarEnteroEnRango,
  validarBooleano,
  validarOpcion
} = require('../../utils/validaciones');

const RANGO_ORDEN = { min: ORDEN_ACCESO.MIN, max: ORDEN_ACCESO.MAX, defecto: ORDEN_ACCESO.MIN };
const L = LONGITUD_COBROS;

// POST /cobros/politica
function validarPolitica(body = {}) {
  return { cobroPorProfesional: validarBooleano(body.cobroPorProfesional, 'cobroPorProfesional') };
}

// POST /cobros/medios/guardar y /cobros/mios/guardar. Con medioId edita; sin él, crea.
// Transferencia: entidadId = banco, tipoCuentaId obligatorio. Billetera: entidadId = billetera.
function validarGuardarMedio(body = {}) {
  return {
    medioId: validarIdOpcional(body.medioId, 'medioId'),
    tipo: validarOpcion(body.tipo, 'tipo', Object.values(TIPOS_MEDIO_COBRO)),
    entidadId: validarIdPositivo(body.entidadId, 'entidadId'),
    tipoCuentaId: validarIdOpcional(body.tipoCuentaId, 'tipoCuentaId'),
    numero: validarTexto(body.numero, 'numero', L.NUMERO),
    titular: validarTexto(body.titular, 'titular', L.TITULAR),
    identificacionTitular: validarTextoOpcional(body.identificacionTitular, 'identificacionTitular', L.IDENTIFICACION),
    alias: validarTextoOpcional(body.alias, 'alias', L.ALIAS),
    qrDocumentoId: validarIdOpcional(body.qrDocumentoId, 'qrDocumentoId'),
    orden: validarEnteroEnRango(body.orden, 'orden', RANGO_ORDEN)
  };
}

// POST /cobros/medios/estado y /cobros/mios/estado
function validarEstadoMedio(body = {}) {
  return {
    medioId: validarIdPositivo(body.medioId, 'medioId'),
    activo: validarBooleano(body.activo, 'activo')
  };
}

module.exports = { validarPolitica, validarGuardarMedio, validarEstadoMedio };
