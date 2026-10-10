const { ESTADOS_SUSCRIPCION, PROVEEDOR_COBRO } = require('../config/constantes');

// Único punto donde se decide cómo se cobra un plan o un módulo suelto.
//
// Hoy no hay pasarela: lo contratado queda VIGENTE al instante.
// Para conectar una pasarela (ej. PayPhone):
//   1. Crear aquí la orden de cobro y devolver { estado: PENDIENTE_PAGO, proveedorPago, referenciaPago }.
//   2. Agregar un webhook que, al confirmar el pago, pase la suscripción a VIGENTE con fechaPago.
// El resto del sistema (acceso, historial) ya trabaja con esos estados.

/**
 * @param {{ monto: number, moneda: string, descripcion: string }} cobro
 * @param {Date} ahora
 * @returns {{ estado: string, proveedorPago: string, referenciaPago: string|null, fechaPago: Date|null }}
 */
async function iniciarCobro(cobro, ahora = new Date()) {
  return {
    estado: ESTADOS_SUSCRIPCION.VIGENTE,
    proveedorPago: PROVEEDOR_COBRO.SIN_PASARELA,
    referenciaPago: null,
    fechaPago: ahora
  };
}

// true si el cobro ya dio acceso (sin pasarela, siempre).
const daAcceso = (resultado) => resultado.estado === ESTADOS_SUSCRIPCION.VIGENTE;

module.exports = { iniciarCobro, daAcceso };
