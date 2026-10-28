const express = require('express');
const crypto = require('crypto');
const { validarFirma, extraerMensajes } = require('../services/meta/MetaProtocolo');

function crearRouter(config, mensajes) {
  const router = express.Router();
  router.get('/', (req, res) => {
    const token = req.query['hub.verify_token'];
    const recibido = typeof token === 'string' ? Buffer.from(token) : Buffer.alloc(0);
    const esperado = Buffer.from(config.verifyToken);
    if (req.query['hub.mode'] !== 'subscribe' || !esperado.length || recibido.length !== esperado.length ||
        !crypto.timingSafeEqual(recibido, esperado) || typeof req.query['hub.challenge'] !== 'string') {
      return res.sendStatus(403);
    }
    return res.status(200).type('text/plain').send(req.query['hub.challenge']);
  });
  // Debe analizarse antes de express.json(): la firma se calcula sobre los bytes originales.
  router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
    if (!validarFirma(req.body, req.get('X-Hub-Signature-256'), config.appSecret)) return res.sendStatus(401);
    let payload;
    try { payload = JSON.parse(req.body.toString('utf8')); }
    catch { return res.sendStatus(400); }
    try {
      await mensajes.guardar(extraerMensajes(payload, config.canales));
      return res.sendStatus(200);
    } catch {
      // Si la cola no pudo persistirse, Meta debe volver a entregar el evento.
      console.error('Meta: no fue posible persistir la notificación.');
      return res.sendStatus(503);
    }
  });
  return router;
}

module.exports = { crearRouter };
