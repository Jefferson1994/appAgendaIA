const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const verificarSecretoSimulador = require('../middlewares/verificarSecretoSimulador');
const WebhooksPagosController = require('../controllers/WebhooksPagosController');
const Paths = require('./paths/WebhooksPagosPaths');

const router = express.Router();

router.post(
  Paths.SIMULADOR,
  verificarSecretoSimulador,
  asyncHandler(WebhooksPagosController.simulador)
);

module.exports = router;