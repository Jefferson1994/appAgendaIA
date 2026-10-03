const express = require('express');

const {
  obtenerDisponibilidad
} = require('./disponibilidad.service');


const router = express.Router();


// =====================================================
// GET /disponibilidad
//
// Ejemplo:
//
// /disponibilidad
// ?profesionalId=1
// &servicioId=1
// &desde=2026-09-30
// &dias=1
// =====================================================

router.get(
  '/',
  async (req, res) => {

    try {

      const {
        profesionalId,
        servicioId,
        desde,
        dias
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


      if (!servicioId) {

        return res
          .status(400)
          .json({

            ok: false,

            codigo:
              'SERVICIO_REQUERIDO',

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

          codigo:
            error.codigo
            ||
            'ERROR_INTERNO',

          error:
            error.message
            ||
            'No fue posible consultar la disponibilidad'

        });

    }

  }
);


module.exports = router;