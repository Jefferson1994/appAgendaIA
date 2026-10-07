class EstadoReservaPagoEB {
  constructor({ cita, pago }) {
    this.cita = {
      id: cita.id,
      estado: cita.estado,
      fechaInicio: cita.fechaInicio.toISOString(),
      fechaExpiracionReserva: cita.fechaExpiracionReserva
        ? cita.fechaExpiracionReserva.toISOString()
        : null
    };

    this.pago = pago
      ? {
          id: pago.id,
          estado: pago.estado,
          proveedor: pago.proveedor,
          referenciaCobro: pago.referenciaCobro,
          montoEsperado: Number(pago.montoEsperado),
          montoRecibido: pago.montoRecibido === null ? null : Number(pago.montoRecibido),
          moneda: pago.moneda,
          fechaExpiracion: pago.fechaExpiracion ? pago.fechaExpiracion.toISOString() : null
        }
      : null;
  }
}

module.exports = EstadoReservaPagoEB;
