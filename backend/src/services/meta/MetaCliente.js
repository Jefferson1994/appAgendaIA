const { leerLimitado } = require('./MetaProtocolo');

async function llamarApi(config, ruta, opciones = {}) {
  const respuesta = await fetch(`https://graph.facebook.com/${config.version}/${ruta}`, {
    ...opciones,
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000), redirect: 'error'
  });
  const datos = JSON.parse((await leerLimitado(respuesta, 65536)).toString('utf8'));
  if (!respuesta.ok || datos.error) throw new Error(`META_HTTP_${respuesta.status}_CODIGO_${datos.error?.code || 'DESCONOCIDO'}`);
  return datos;
}

async function enviarTexto(config, numeroId, destinatario, texto) {
  const resultado = await llamarApi(config, `${numeroId}/messages`, {
    method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual',
      to: destinatario, type: 'text', text: { body: texto } })
  });
  if (!resultado.messages?.[0]?.id) throw new Error('META_RESPUESTA_SIN_ID');
  return resultado.messages[0].id;
}

async function consultarChat(config, mensaje) {
  const respuesta = await fetch(config.n8nUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json',
      ...(config.n8nSecreto ? { 'X-Agenda-Secret': config.n8nSecreto } : {}) },
    body: JSON.stringify({ usuario_id: `meta:${mensaje.remitente}`, canal_id: mensaje.canalId,
      texto: mensaje.texto, telefono_whatsapp: mensaje.remitente, mensaje_id: mensaje.id }),
    signal: AbortSignal.timeout(120000), redirect: 'error'
  });
  const contenido = (await leerLimitado(respuesta, 65536)).toString('utf8');
  if (!respuesta.ok) throw new Error(`N8N_HTTP_${respuesta.status}`);
  let texto = contenido;
  if ((respuesta.headers.get('content-type') || '').includes('application/json')) {
    try {
      const datos = JSON.parse(contenido);
      texto = typeof datos === 'string' ? datos : datos.output;
    } catch { throw new Error('N8N_RESPUESTA_INVALIDA'); }
  }
  if (typeof texto !== 'string' || !texto.trim() || /Agent stopped due to max iterations/i.test(texto)) {
    throw new Error('N8N_RESPUESTA_INVALIDA');
  }
  return texto.trim();
}

async function descargarMedio(config, medio) {
  if (!/^\d+$/.test(medio?.id || '')) throw new Error('META_MEDIO_INVALIDO');
  const limite = Math.max(1, Math.min(Number(process.env.DOCUMENTO_MAX_MB) || 5, 15)) * 1024 * 1024;
  const datos = await llamarApi(config, medio.id);
  const url = new URL(datos.url);
  // No se envían credenciales a direcciones proporcionadas por el cliente ni a redirecciones.
  if (url.protocol !== 'https:' || !(url.hostname === 'lookaside.fbsbx.com' || url.hostname.endsWith('.fbsbx.com'))) {
    throw new Error('META_URL_MEDIO_INVALIDA');
  }
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(datos.mime_type) || Number(datos.file_size) > limite) {
    throw new Error('META_MEDIO_FORMATO_O_TAMANO');
  }
  const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${config.token}` },
    signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!respuesta.ok) throw new Error(`META_MEDIO_HTTP_${respuesta.status}`);
  return { contenido: await leerLimitado(respuesta, limite), mimeType: datos.mime_type, nombreOriginal: medio.nombre };
}

module.exports = { enviarTexto, consultarChat, descargarMedio };
