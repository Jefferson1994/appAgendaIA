const { validarIdPositivo, validarImporte, validarTexto, validarTextoOpcional, validarOpcion } = require('../../utils/validaciones');
const { LONGITUD_MAX, METODO_PAGO } = require('../../config/constantes');

function validarConfirmacion(body = {}) {
  return {
    pagoId: validarIdPositivo(body.pagoId, 'pagoId'),
    monto: validarImporte(body.monto, 'monto', { min: 0.01, max: 99999999.99 }),
    referenciaBancaria: validarTextoOpcional(body.referenciaBancaria, 'referenciaBancaria', LONGITUD_MAX.REFERENCIA),
    observacion: validarTextoOpcional(body.observacion, 'observacion', 500)
  };
}

function validarReporte(body = {}) {
  return {
    canalId: validarTexto(body.canal_id, 'canal_id'),
    citaId: validarIdPositivo(body.cita_id, 'cita_id'),
    referenciaBancaria: validarTextoOpcional(body.referencia_bancaria, 'referencia_bancaria', LONGITUD_MAX.REFERENCIA)
  };
}

function validarMetodo(valor) {
  if (valor === undefined || valor === null || valor === '') return METODO_PAGO.PASARELA;
  return validarOpcion(valor, 'metodo', Object.values(METODO_PAGO));
}

module.exports = { validarConfirmacion, validarReporte, validarMetodo };
