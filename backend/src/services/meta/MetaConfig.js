function obtenerConfig() {
  let canales;
  try {
    canales = JSON.parse(process.env.META_WHATSAPP_CHANNEL_MAP || '{}');
  } catch {
    throw new Error('META_WHATSAPP_CHANNEL_MAP debe ser un objeto JSON válido.');
  }
  if (!canales || Array.isArray(canales) || typeof canales !== 'object' ||
      Object.entries(canales).some(([id, canal]) => !/^\d+$/.test(id) || typeof canal !== 'string' || !canal.trim())) {
    throw new Error('META_WHATSAPP_CHANNEL_MAP debe asociar phone_number_id con identificadores de canal.');
  }
  const config = {
    habilitado: process.env.META_WHATSAPP_ENABLED === 'true',
    token: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
    appSecret: process.env.META_WHATSAPP_APP_SECRET || '',
    verifyToken: process.env.META_WHATSAPP_VERIFY_TOKEN || '',
    version: process.env.META_WHATSAPP_API_VERSION || 'v25.0',
    puerto: Number(process.env.META_WHATSAPP_WEBHOOK_PORT || 3002),
    host: process.env.META_WHATSAPP_WEBHOOK_HOST || '127.0.0.1',
    n8nUrl: process.env.META_WHATSAPP_N8N_URL || 'http://127.0.0.1:5678/webhook/chat-agenda',
    n8nSecreto: process.env.META_WHATSAPP_N8N_SECRET || '',
    canales
  };
  if (config.habilitado) {
    if (!config.token || !config.appSecret || config.verifyToken.length < 32 || !Object.keys(canales).length) {
      throw new Error('Meta: completa ACCESS_TOKEN, APP_SECRET, VERIFY_TOKEN (mínimo 32 caracteres) y CHANNEL_MAP en .env.');
    }
    if (!/^v\d+\.\d+$/.test(config.version) || !Number.isInteger(config.puerto) || config.puerto < 1024 || config.puerto > 65535) {
      throw new Error('Meta: versión o puerto de webhook inválido.');
    }
    const destino = new URL(config.n8nUrl);
    if (!['http:', 'https:'].includes(destino.protocol)) throw new Error('Meta: URL de n8n inválida.');
  }
  return config;
}

module.exports = { obtenerConfig };
