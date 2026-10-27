class PagoEB {
  constructor(pago, creada, mediosCobro = []) {
    this.creada = creada;
    this.pago = {
      id: pago.id,
      estado: pago.estado,
      metodo: pago.metodo,
      proveedor: pago.proveedor,
      referenciaCobro: pago.referenciaCobro,
      montoEsperado: Number(pago.montoEsperado),
      montoRecibido: pago.montoRecibido === null || pago.montoRecibido === undefined ? null : Number(pago.montoRecibido),
      moneda: pago.moneda,
      porcentajeAnticipoAplicado: pago.porcentajeAnticipoAplicado ? Number(pago.porcentajeAnticipoAplicado) : null,
      fechaExpiracion: pago.fechaExpiracion ? pago.fechaExpiracion.toISOString() : null,
      urlPago: pago.urlPago || null,
      referenciaBancaria: pago.referenciaBancaria || null
    };
    this.cita = pago.cita
      ? {
          id: pago.cita.id,
          estado: pago.cita.estado,
          fechaInicio: pago.cita.fechaInicio ? pago.cita.fechaInicio.toISOString() : null,
          cliente: pago.cita.cliente
            ? [pago.cita.cliente.nombre, pago.cita.cliente.apellido].filter(Boolean).join(' ')
            : null,
          telefono: pago.cita.cliente ? pago.cita.cliente.telefono : null,
          servicio: pago.cita.servicio ? pago.cita.servicio.nombre : null,
          profesional: pago.cita.profesional
            ? [pago.cita.profesional.nombre, pago.cita.profesional.apellido].filter(Boolean).join(' ')
            : null
        }
      : null;
    this.mediosCobro = mediosCobro.map((medio) => ({
      tipo: medio.tipo,
      entidad: medio.entidad ? medio.entidad.nombre : null,
      tipoCuenta: medio.tipoCuenta ? medio.tipoCuenta.nombre : null,
      numero: medio.numero,
      titular: medio.titular,
      identificacionTitular: medio.identificacionTitular || null,
      alias: medio.alias || null
    }));
  }
}

module.exports = PagoEB;
