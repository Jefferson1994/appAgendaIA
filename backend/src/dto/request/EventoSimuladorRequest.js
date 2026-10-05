const { LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto } = require('../../utils/validaciones');
const { normalizarMonto } = require('../../utils/montos');

// POST /webhooks/pagos/simulador
function validarEvento(body = {}) {
  return {
    eventoId: validarTexto(body.evento_id, 'evento_id'),
    referenciaCobro: validarTexto(body.referencia_cobro, 'referencia_cobro', LONGITUD_MAX.REFERENCIA),
    monto: normalizarMonto(body.monto)
  };
}

module.exports = { validarEvento };