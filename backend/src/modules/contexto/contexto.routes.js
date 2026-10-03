const express = require('express');

const {
  resolverCanal
} = require('./contexto.service');


const router = express.Router();


// =====================================================
// GET /contexto/canal/:identificador
// =====================================================
//
// Ejemplos:
//
// GET /contexto/canal/wa-carlos-demo
//
// GET /contexto/canal/wa-ana-demo
//
// =====================================================

router.get(
  '/canal/:identificador',
  async (req, res) => {

    try {

      const {
        identificador
      } = req.params;


      const resultado =
        await resolverCanal(
          identificador
        );


      return res.json({
        ok: true,
        ...resultado
      });

    } catch (error) {

      console.error(
        'Error resolviendo contexto del canal:',
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
            'No fue posible resolver el contexto del canal'

        });

    }

  }
);


module.exports = router;