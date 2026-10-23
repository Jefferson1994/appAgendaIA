const { validarEnteroEnRango, validarTexto } = require('../../utils/validaciones');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../../config/constantes');

function validarEvento(body = {}) {
  const transactionId = validarEnteroEnRango(body.TransactionId, 'TransactionId', { min: 1, max: Number.MAX_SAFE_INTEGER });
  const amount = validarEnteroEnRango(body.Amount, 'Amount', { min: 1, max: 999999999 });
  const statusCode = validarEnteroEnRango(body.StatusCode, 'StatusCode', { min: 1, max: 999 });
  const transactionStatus = validarTexto(body.TransactionStatus, 'TransactionStatus', 30);
  if (statusCode !== 3 || transactionStatus.toUpperCase() !== 'APPROVED') {
    throw new AppError(MSG.PAYPHONE_PAGO_NO_APROBADO, HTTP.CONFLICTO);
  }
  return {
    transactionId,
    amount,
    clientTransactionId: validarTexto(body.ClientTransactionId, 'ClientTransactionId', 30),
    storeId: validarTexto(body.StoreId, 'StoreId', LONGITUD_MAX.TEXTO),
    payload: body
  };
}

module.exports = { validarEvento };
