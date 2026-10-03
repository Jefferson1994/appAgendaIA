const express = require('express');

const {
  buscarServicios,
  buscarServicioPorId
} = require('./servicios.service');


const router = express.Router();


// =====================================================
// GET /servicios
//
// Ejemplos:
//
// /servicios?profesionalId=1
//
// /servicios?profesionalId=2&texto=limpieza
// =====================================================

router.get(
  '/',
  async (req, res) => {

    try {

      const {
        profesionalId,
        texto
      } = req.query;


      if (!profesionalId) {

        return res
          .status(400)
          .json({

            ok: false,

            codigo:
              'PROFESIONAL_REQUERIDO',

            error:
              'profesionalId es obligatorio'

          });

      }


      const servicios =
        await buscarServicios(
          profesionalId,
          texto
        );


      return res.json({
        ok: true,
        servicios
      });

    } catch (error) {

      console.error(
        'Error consultando servicios:',
        error
      );


      return res
        .status(
          error.statusCode || 500
        )
        .json({

          ok: false,

          codigo:
            error.codigo
            ||
            'ERROR_INTERNO',

          error:
            error.message
            ||
            'No fue posible consultar los servicios'

        });

    }

  }
);


// =====================================================
// GET /servicios/:id
//
// Ejemplo:
//
// /servicios/1?profesionalId=1
// =====================================================

router.get(
  '/:id',
  async (req, res) => {

    try {

      const {
        profesionalId
      } = req.query;


      if (!profesionalId) {

        return res
          .status(400)
          .json({

            ok: false,

            codigo:
              'PROFESIONAL_REQUERIDO',

            error:
              'profesionalId es obligatorio'

          });

      }


      const servicio =
        await buscarServicioPorId(
          profesionalId,
          req.params.id
        );


      if (!servicio) {

        return res
          .status(404)
          .json({

            ok: false,

            codigo:
              'SERVICIO_NO_ENCONTRADO',

            error:
              'El profesional no ofrece ese servicio'

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


      return res
        .status(
          error.statusCode || 500
        )
        .json({

          ok: false,

          codigo:
            error.codigo
            ||
            'ERROR_INTERNO',

          error:
            error.message
            ||
            'No fue posible consultar el servicio'

        });

    }

  }
);


module.exports = router;