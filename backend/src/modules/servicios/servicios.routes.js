const express = require('express');

const {
  buscarServicios,
  buscarServicioPorId
} = require('./servicios.service');

const router = express.Router();


// =====================================================
// GET /servicios
// GET /servicios?texto=consulta
// =====================================================

router.get('/', async (req, res) => {

  try {

    const { texto } = req.query;

    const servicios =
      await buscarServicios(texto);

    return res.json({
      ok: true,
      servicios
    });

  } catch (error) {

    console.error(
      'Error consultando servicios:',
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        'No fue posible consultar los servicios'
    });

  }

});


// =====================================================
// GET /servicios/:id
// =====================================================

router.get('/:id', async (req, res) => {

  try {

    const servicio =
      await buscarServicioPorId(
        req.params.id
      );


    if (!servicio) {

      return res.status(404).json({
        ok: false,
        error:
          'Servicio no encontrado'
      });

    }


    return res.json({
      ok: true,
      servicio
    });

  } catch (error) {

    console.error(
      'Error consultando servicio:',
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        'No fue posible consultar el servicio'
    });

  }

});


module.exports = router;