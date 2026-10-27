const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const verificarSecretoSimulador = require('../middlewares/verificarSecretoSimulador');
const WebhooksPagosController = require('../controllers/WebhooksPagosController');
const Paths = require('./paths/WebhooksPagosPaths');

const router = express.Router();
router.post(Paths.SIMULADOR, verificarSecretoSimulador, asyncHandler(WebhooksPagosController.simulador));
// PayPhone envía esta notificación desde sus servidores: no usa el secreto del simulador.
router.post(Paths.PAYPHONE, asyncHandler(WebhooksPagosController.payphone));

module.exports = router;
