// Resultado del procesamiento de un evento de pago, hacia afuera.
class EventoPagoEB {
  constructor({ idempotente, resultado, pagoId, citaId }) {
    this.idempotente = idempotente;
    this.resultado = resultado;
    this.pagoId = pagoId;
    this.citaId = citaId;
  }
}

module.exports = EventoPagoEB;