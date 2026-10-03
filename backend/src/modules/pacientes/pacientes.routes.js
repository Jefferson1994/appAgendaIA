const express =
  require('express');

const {

  leerPacientes,

  registrarPaciente

} = require('./pacientes.service');


const router =
  express.Router();


// =====================================================
// Dar formato compatible con el MVP anterior
// =====================================================

function formatearCliente(
  cliente
) {

  return {

    Id:
      cliente.id,

    OrganizacionId:
      cliente.organizacionId,

    Nombre:
      cliente.nombre,

    Telefono:
      cliente.telefono,

    Direccion:
      cliente.direccion
      ||
      'N/D',

    Fecha:
      cliente.fechaCreacion

  };
}


// =====================================================
// GET /leads?organizacionId=1
// =====================================================

router.get(
  '/',
  async (req, res) => {

    try {

      const {
        organizacionId
      } = req.query;


      if (!organizacionId) {

        return res
          .status(400)
          .json({

            ok: false,

            codigo:
              'ORGANIZACION_REQUERIDA',

            error:
              'organizacionId es obligatorio'

          });

      }


      const clientes =
        await leerPacientes(
          organizacionId
        );


      return res.json({

        ok:
          true,

        leads:
          clientes.map(
            formatearCliente
          )

      });

    } catch (error) {

      console.error(
        'Error consultando clientes:',
        error
      );


      return res
        .status(
          error.statusCode
          ||
          500
        )
        .json({

          ok:
            false,

          codigo:
            error.codigo
            ||
            'ERROR_INTERNO',

          error:
            error.message
            ||
            'No fue posible consultar los clientes'

        });

    }

  }
);


// =====================================================
// POST /leads
// =====================================================

router.post(
  '/',
  async (req, res) => {

    try {

      const {

        organizacionId,

        nombre,

        telefono,

        direccion

      } = req.body;


      if (!organizacionId) {

        return res
          .status(400)
          .json({

            ok: false,

            codigo:
              'ORGANIZACION_REQUERIDA',

            error:
              'organizacionId es obligatorio'

          });

      }


      if (
        !nombre
        ||
        !telefono
      ) {

        return res
          .status(400)
          .json({

            ok: false,

            codigo:
              'DATOS_INCOMPLETOS',

            error:
              'nombre y telefono son obligatorios'

          });

      }


      const resultado =
        await registrarPaciente({

          organizacionId,

          nombre,

          telefono,

          direccion

        });


      const cliente =
        formatearCliente(
          resultado.paciente
        );


      return res.json({

        ok:
          true,

        nuevo:
          resultado.nuevo,

        cliente,

        // Temporalmente conservamos
        // "lead" para no romper n8n.
        lead:
          cliente

      });

    } catch (error) {

      console.error(
        'Error registrando cliente:',
        error
      );


      return res
        .status(
          error.statusCode
          ||
          500
        )
        .json({

          ok:
            false,

          codigo:
            error.codigo
            ||
            'ERROR_INTERNO',

          error:
            error.message
            ||
            'No fue posible registrar el cliente'

        });

    }

  }
);


module.exports =
  router;