const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { crearAppWebhook } = require('../src/services/meta/MetaIntegracion');
const { validarFirma, extraerMensajes, dividirTexto } = require('../src/services/meta/MetaProtocolo');
const Cliente = require('../src/services/meta/MetaCliente');

const config = { verifyToken: 'verify-token-prueba-32-caracteres-00000', appSecret: 'secreto-prueba',
  canales: { '123456': 'wa-fredy-demo' }, version: 'v25.0', token: 'token-prueba',
  n8nUrl: 'http://127.0.0.1:5678/webhook/chat-agenda' };
const payload = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
  metadata: { phone_number_id: '123456' }, messages: [{ id: 'wamid.prueba', from: '593999999999',
    type: 'text', text: { body: 'Quiero reservar' } }] } }] }] };

test('la firma usa bytes originales y rechaza cuerpo modificado o cabecera inválida', () => {
  const raw = Buffer.from(JSON.stringify(payload));
  const firma = `sha256=${crypto.createHmac('sha256', config.appSecret).update(raw).digest('hex')}`;
  assert.equal(validarFirma(raw, firma, config.appSecret), true);
  assert.equal(validarFirma(Buffer.concat([raw, Buffer.from(' ')]), firma, config.appSecret), false);
  assert.equal(validarFirma(raw, 'sha256=123', config.appSecret), false);
  assert.equal(validarFirma(raw, undefined, config.appSecret), false);
});

test('canal proviene del número de destino; estados y números no configurados no crean mensajes', () => {
  const entrada = structuredClone(payload);
  entrada.entry[0].changes[0].value.messages[0].canal_id = 'otro-profesional';
  assert.equal(extraerMensajes(entrada, config.canales)[0].canalId, 'wa-fredy-demo');
  assert.deepEqual(extraerMensajes(entrada, {}), []);
  entrada.entry[0].changes[0].value.messages = undefined;
  entrada.entry[0].changes[0].value.statuses = [{ id: 'enviado' }];
  assert.deepEqual(extraerMensajes(entrada, config.canales), []);
});

test('GET valida token, POST rechaza firmas falsas y solo confirma después de persistir', async () => {
  let guardados = 0;
  let fallar = false;
  const servidor = crearAppWebhook(config, { async guardar(mensajes) {
    if (fallar) throw new Error('BD caída');
    guardados += mensajes.length;
  } }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  try {
    const q = new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.verify_token': config.verifyToken, 'hub.challenge': '12345' });
    const verificado = await fetch(`${base}/webhooks/whatsapp?${q}`);
    assert.equal(verificado.status, 200);
    assert.equal(await verificado.text(), '12345');
    assert.equal((await fetch(`${base}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=12345`)).status, 403);
    assert.equal((await fetch(`${base}/health`)).status, 404); // El puerto público no expone API internas.
    const raw = JSON.stringify(payload);
    const firma = `sha256=${crypto.createHmac('sha256', config.appSecret).update(raw).digest('hex')}`;
    const enviar = (signature) => fetch(`${base}/webhooks/whatsapp`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body: raw });
    assert.equal((await enviar('sha256=00')).status, 401);
    assert.equal(guardados, 0);
    assert.equal((await enviar(firma)).status, 200);
    assert.equal(guardados, 1);
    fallar = true;
    assert.equal((await enviar(firma)).status, 503); // Meta debe poder reentregar, sin falsa aceptación.
  } finally { await new Promise(resolve => servidor.close(resolve)); }
});

test('adaptador envía teléfono real y conserva sesión por remitente; comprueba aceptación de Meta', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url, opciones) => {
      const body = JSON.parse(opciones.body);
      assert.equal(url, config.n8nUrl);
      assert.equal(body.canal_id, 'wa-fredy-demo');
      assert.equal(body.telefono_whatsapp, '593999999999');
      assert.equal(body.usuario_id, 'meta:593999999999');
      return new Response('¿Qué fecha prefieres?', { headers: { 'Content-Type': 'text/plain' } });
    };
    const mensaje = extraerMensajes(payload, config.canales)[0];
    assert.equal(await Cliente.consultarChat(config, mensaje), '¿Qué fecha prefieres?');
    global.fetch = async () => new Response(JSON.stringify({ messages: [{ id: 'wamid.salida' }] }));
    assert.equal(await Cliente.enviarTexto(config, '123456', mensaje.remitente, 'Hola'), 'wamid.salida');
    global.fetch = async () => new Response('{}');
    await assert.rejects(Cliente.enviarTexto(config, '123456', mensaje.remitente, 'Hola'), /SIN_ID/);
  } finally { global.fetch = original; }
});

test('respuestas largas se dividen sin corromper emoji ni perder texto', () => {
  const texto = '😀'.repeat(4100);
  const partes = dividirTexto(texto);
  assert.equal(partes.length, 3);
  assert.equal(partes.join(''), texto);
  assert.ok(partes.every(parte => parte.length <= 4000));
  assert.equal(Array.from(partes[0]).length, 2000);
});
