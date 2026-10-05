const express = require('express');
const { solicitarPago } = require('./pagos.service');

const router = express.Router();

router.post('/solicitar', async (req, res) => {
  try {
    const resultado = await solicitarPago({
      canalId: req.body?.canal_id,
      citaId: req.body?.cita_id
    });

    return res.status(resultado.creada ? 201 : 200).json({
      ok: true,
      ...resultado,
      mensaje: resultado.creada
        ? 'Solicitud de pago creada en modo simulador.'
        : 'Ya existe una solicitud de pago vigente para esta reserva.'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      codigo: error.codigo || 'ERROR_INTERNO',
      error: error.statusCode ? error.message : 'No fue posible crear la solicitud de pago'
    });
  }
});

module.exports = router;
