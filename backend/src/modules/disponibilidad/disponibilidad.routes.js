const express = require('express');

const {
  obtenerDisponibilidad
} = require('./disponibilidad.service');

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const {
      profesionalId,
      servicioId,
      desde,
      dias
    } = req.query;


    if (!servicioId) {
      return res.status(400).json({
        ok: false,
        error:
          'servicioId es obligatorio'
      });
    }


    const disponibilidad =
      await obtenerDisponibilidad({
        profesionalId,
        servicioId,
        desde,
        dias
      });


    return res.json({
      ok: true,
      ...disponibilidad
    });

  } catch (error) {
    console.error(
      'Error consultando disponibilidad:',
      error
    );


    return res
      .status(
        error.statusCode || 500
      )
      .json({
        ok: false,
        error:
          error.message
          ||
          'No fue posible consultar la disponibilidad'
      });
  }
});


module.exports = router;