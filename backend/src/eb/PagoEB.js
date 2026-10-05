class PagoEB {
  constructor(pago, creada) {
    this.creada = creada;
    this.pago = {
      id: pago.id,
      estado: pago.estado,
      proveedor: pago.proveedor,
      referenciaCobro: pago.referenciaCobro,
      montoEsperado: Number(pago.montoEsperado),
      moneda: pago.moneda,
      porcentajeAnticipoAplicado: pago.porcentajeAnticipoAplicado
        ? Number(pago.porcentajeAnticipoAplicado)
        : null,
      fechaExpiracion: pago.fechaExpiracion ? pago.fechaExpiracion.toISOString() : null,
      urlPago: pago.urlPago
    };
  }
}

module.exports = PagoEB;