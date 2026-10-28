const express = require('express');
const { obtenerConfig } = require('./MetaConfig');
const { crearRouter } = require('../../routes/meta.whatsapp.routes');
const Mensajes = require('../../repositories/MetaMensajesRepository');
const { iniciarProcesador } = require('./MetaMensajesService');

let servidor;
let detenerProcesador;

function crearAppWebhook(config, repositorio = Mensajes) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/webhooks/whatsapp', crearRouter(config, repositorio));
  app.use((_req, res) => res.sendStatus(404));
  app.use((error, _req, res, _next) => res.sendStatus(error.type === 'entity.too.large' ? 413 : 400));
  return app;
}

async function iniciarIntegracionMeta() {
  const config = obtenerConfig();
  if (!config.habilitado) return;
  await new Promise((resolve, reject) => {
    servidor = crearAppWebhook(config).listen(config.puerto, config.host, resolve);
    servidor.once('error', reject);
  });
  detenerProcesador = iniciarProcesador(config);
  console.log(`Meta: receptor disponible en http://${config.host}:${config.puerto}/webhooks/whatsapp`);
}

async function detenerIntegracionMeta() {
  if (servidor) await new Promise(resolve => servidor.close(resolve));
  if (detenerProcesador) await detenerProcesador();
}

module.exports = { crearAppWebhook, iniciarIntegracionMeta, detenerIntegracionMeta };
