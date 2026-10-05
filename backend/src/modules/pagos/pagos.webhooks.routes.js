const express = require('express');
const { procesarWebhookSimulador } = require('./pagos.service');

const router = express.Router();

function noDisponibleEnProduccion(res) {
  return res.status(404).json({
    ok: false,
    codigo: 'RUTA_NO_DISPONIBLE',
    error: 'El simulador de pagos no está disponible en producción'
  });
}

router.post('/simulador', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return noDisponibleEnProduccion(res);
  }

  const secretoConfigurado = process.env.PAGO_SIMULADOR_SECRETO;
  if (!secretoConfigurado) {
    return res.status(503).json({
      ok: false,
      codigo: 'SIMULADOR_SIN_CONFIGURAR',
      error: 'Configura PAGO_SIMULADOR_SECRETO para usar el simulador'
    });
  }

  if (
    req.get('x-pago-simulador-secreto') !== secretoConfigurado
  ) {
    return res.status(401).json({
      ok: false,
      codigo: 'WEBHOOK_NO_AUTORIZADO',
      error: 'El secreto del simulador no es válido'
    });
  }

  try {
    const resultado = await procesarWebhookSimulador({
      eventoId: req.body?.evento_id,
      referenciaCobro: req.body?.referencia_cobro,
      monto: req.body?.monto
    });

    return res.json({ ok: true, ...resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      codigo: error.codigo || 'ERROR_INTERNO',
      error: error.statusCode ? error.message : 'No fue posible procesar el webhook simulado'
    });
  }
});

module.exports = router;
