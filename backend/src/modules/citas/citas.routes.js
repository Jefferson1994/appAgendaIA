const express = require('express');
const { crearReservaTemporal } = require('./citas.service');

const router = express.Router();

// POST /citas/reservar
router.post('/reservar', async (req, res) => {
  try {
    const {
      canal_id,
      cliente_id,
      servicio_id,
      fecha_inicio
    } = req.body || {};

    const resultado = await crearReservaTemporal({
      canalId: canal_id,
      clienteId: cliente_id,
      servicioId: servicio_id,
      fechaInicio: fecha_inicio
    });

    return res.status(resultado.creada ? 201 : 200).json({
      ok: true,
      ...resultado,
      mensaje: resultado.creada
        ? 'Reserva temporal creada. Aún no es una cita confirmada.'
        : 'Ya existe una reserva temporal vigente para ese horario.'
    });
  } catch (error) {
    console.error('Error creando reserva temporal:', error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      codigo: error.codigo || 'ERROR_INTERNO',
      error: error.statusCode
        ? error.message
        : 'No fue posible crear la reserva temporal'
    });
  }
});

module.exports = router;
