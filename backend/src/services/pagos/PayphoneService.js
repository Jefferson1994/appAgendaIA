const crypto = require('crypto');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, MONEDA_DEFECTO } = require('../../config/constantes');

const API_LINKS_URL = process.env.PAYPHONE_LINKS_URL || 'https://pay.payphonetodoesposible.com/api/Links';

function configuracion() {
  const token = (process.env.PAYPHONE_TOKEN || '').trim();
  const storeId = (process.env.PAYPHONE_STORE_ID || '').trim();
  return token && storeId ? { token, storeId } : null;
}

function estaConfigurado() {
  return Boolean(configuracion());
}

function generarReferenciaSolicitud(pagoId) {
  // PayPhone admite máximo 15 caracteres. El id del pago permite encontrarlo en el webhook.
  return `A${pagoId}${crypto.randomBytes(5).toString('hex')}`;
}

function aCentavos(monto) {
  return Math.round(Number(monto) * 100);
}

async function crearLink({ pago, cita }) {
  const config = configuracion();
  if (!config) throw new AppError(MSG.PAYPHONE_SIN_CONFIGURAR, HTTP.NO_DISPONIBLE);

  const referenciaSolicitudProveedor = pago.referenciaSolicitudProveedor;
  if (!referenciaSolicitudProveedor) throw new AppError(MSG.PAYPHONE_LINK_ERROR, HTTP.ERROR_INTERNO);
  const monto = aCentavos(pago.montoEsperado);
  const payload = {
    amount: monto,
    amountWithoutTax: monto,
    currency: pago.moneda || MONEDA_DEFECTO,
    reference: `Cita ${cita.id}: ${cita.servicio.nombre}`.slice(0, 100),
    clientTransactionId: referenciaSolicitudProveedor,
    storeId: config.storeId,
    additionalData: JSON.stringify({ citaId: cita.id, pagoId: pago.id, referenciaCobro: pago.referenciaCobro }).slice(0, 250),
    oneTime: true,
    // La cita protege el horario por 15 minutos. PayPhone permite expiración por horas;
    // el backend continúa rechazando pagos que lleguen después de la reserva.
    expireIn: 1,
    isAmountEditable: false
  };

  let respuesta;
  try {
    respuesta = await fetch(API_LINKS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw new AppError(MSG.PAYPHONE_NO_DISPONIBLE, HTTP.NO_DISPONIBLE);
  }

  const texto = await respuesta.text();
  if (!respuesta.ok) throw new AppError(MSG.PAYPHONE_LINK_ERROR, HTTP.NO_DISPONIBLE);

  let enlace = texto.trim();
  try {
    const json = JSON.parse(enlace);
    enlace = typeof json === 'string' ? json : json.url || json.link || '';
  } catch {
    // La API puede responder directamente un string con el enlace.
  }

  if (!/^https:\/\//i.test(enlace)) throw new AppError(MSG.PAYPHONE_LINK_ERROR, HTTP.NO_DISPONIBLE);
  return { urlPago: enlace, referenciaSolicitudProveedor };
}

function storeIdCoincide(storeId) {
  const config = configuracion();
  return Boolean(config && String(storeId) === config.storeId);
}

module.exports = { estaConfigurado, crearLink, generarReferenciaSolicitud, storeIdCoincide };
