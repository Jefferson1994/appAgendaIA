const CalendarioService = require('../services/CalendarioService');
const { ok } = require('../utils/respuesta');
const MSG = require('../config/mensajes');

async function autorizarGoogle(req, res) {
  return ok(res, { url: CalendarioService.urlAutorizacion(req.usuario) }, MSG.GOOGLE_CALENDAR_AUTORIZAR);
}

async function consultarGoogle(req, res) {
  return ok(res, await CalendarioService.consultar(req.usuario), MSG.GOOGLE_CALENDAR_OK);
}

async function callbackGoogle(req, res) {
  await CalendarioService.intercambiarCodigo(req.query.code, req.query.state);
  return res.status(200).send('<!doctype html><html lang="es"><body><h2>Google Calendar conectado correctamente.</h2><p>Ya puedes cerrar esta ventana y volver a Agenda IA.</p></body></html>');
}

module.exports = { autorizarGoogle, consultarGoogle, callbackGoogle };
