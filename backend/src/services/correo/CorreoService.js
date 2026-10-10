const nodemailer = require('nodemailer');
const { CORREO } = require('../../config/constantes');

// Único punto de envío de correos. El proveedor se elige con CORREO_PROVEEDOR en el .env:
//   ninguno (por defecto): no envía; quien llama decide qué hacer (ej. mostrar la clave al admin).
//   smtp: Mailtrap, Gmail, SES o cualquier SMTP, con SMTP_HOST, SMTP_PORT, SMTP_USUARIO, SMTP_CLAVE.
// Para otro proveedor por API (SendGrid, Resend...), agregar aquí su rama con el mismo contrato.

let transporte = null;

function proveedorConfigurado() {
  return (process.env.CORREO_PROVEEDOR || CORREO.PROVEEDORES.NINGUNO).trim().toLowerCase();
}

function obtenerTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SEGURO === 'true',
      auth: { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_CLAVE }
    });
  }
  return transporte;
}

/**
 * Envía un correo. Nunca lanza: si no hay proveedor o el envío falla, devuelve enviado = false
 * para que el flujo que lo pidió (crear usuario, restablecer clave) no se caiga.
 *
 * @param {{ para: string, asunto: string, texto: string, html: string }} correo
 * @returns {Promise<{ enviado: boolean }>}
 */
async function enviar({ para, asunto, texto, html }) {
  if (proveedorConfigurado() !== CORREO.PROVEEDORES.SMTP) {
    return { enviado: false };
  }

  try {
    await obtenerTransporte().sendMail({ from: process.env.CORREO_REMITENTE, to: para, subject: asunto, text: texto, html });
    return { enviado: true };
  } catch (error) {
    console.error('No se pudo enviar el correo:', error.message);
    return { enviado: false };
  }
}

module.exports = { enviar };
