const crypto = require('crypto');

function validarFirma(contenido, firma, secreto) {
  if (!Buffer.isBuffer(contenido) || !secreto || !/^sha256=[a-f0-9]{64}$/i.test(firma || '')) return false;
  const esperada = crypto.createHmac('sha256', secreto).update(contenido).digest();
  return crypto.timingSafeEqual(esperada, Buffer.from(firma.slice(7), 'hex'));
}

function extraerMensajes(payload, canales) {
  if (payload?.object !== 'whatsapp_business_account') return [];
  const mensajes = [];
  for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
    for (const cambio of Array.isArray(entry?.changes) ? entry.changes : []) {
      if (cambio.field !== 'messages') continue;
      const valor = cambio.value;
      const numeroId = valor?.metadata?.phone_number_id;
      const canalId = canales[numeroId];
      if (!canalId) continue;
      for (const mensaje of Array.isArray(valor.messages) ? valor.messages : []) {
        if (!mensaje) continue;
        if (typeof mensaje.id !== 'string' || mensaje.id.length > 255 || !/^\d{6,20}$/.test(mensaje.from || '')) continue;
        const tipo = mensaje.type;
        const texto = tipo === 'text' ? mensaje.text?.body :
          tipo === 'button' ? mensaje.button?.text :
            tipo === 'interactive' ? (mensaje.interactive?.button_reply?.title || mensaje.interactive?.list_reply?.title) : null;
        mensajes.push({
          id: mensaje.id,
          numeroId,
          canalId,
          remitente: mensaje.from,
          conversacion: `${numeroId}:${mensaje.from}`,
          tipo: String(tipo || 'unknown').slice(0, 30),
          texto: typeof texto === 'string' ? texto.slice(0, 10000) : null,
          // Conserva únicamente metadatos del adjunto, nunca tokens ni la notificación completa.
          medio: ['image', 'document'].includes(tipo) ? {
            id: mensaje[tipo]?.id,
            mimeType: mensaje[tipo]?.mime_type,
            nombre: mensaje[tipo]?.filename || `comprobante-${mensaje.id.slice(-12)}`
          } : undefined
        });
      }
    }
  }
  return mensajes;
}

function dividirTexto(texto, maximo = 4000) {
  const partes = [];
  let parte = '';
  for (const caracter of texto) {
    if (parte.length + caracter.length > maximo) { partes.push(parte); parte = ''; }
    parte += caracter;
  }
  if (parte) partes.push(parte);
  return partes;
}

async function leerLimitado(respuesta, maximo) {
  const partes = [];
  let total = 0;
  for await (const parte of respuesta.body) {
    total += parte.length;
    if (total > maximo) throw new Error('Respuesta externa excede el tamaño permitido.');
    partes.push(parte);
  }
  return Buffer.concat(partes);
}

module.exports = { validarFirma, extraerMensajes, dividirTexto, leerLimitado };
