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

function formatearCliente(cliente) {

  return {
    Id:
      cliente.id,

    Nombre:
      cliente.nombre,

    Telefono:
      cliente.telefono,

    Direccion:
      cliente.direccion || 'N/D',

    Fecha:
      cliente.fechaCreacion
  };

}


// =====================================================
// GET /leads
// =====================================================

router.get('/', async (req, res) => {

  try {

    const clientes =
      await leerPacientes();


    return res.json({
      ok: true,

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


    return res.status(500).json({
      ok: false,
      error:
        'No fue posible consultar los clientes'
    });

  }

});


// =====================================================
// POST /leads
// =====================================================

router.post('/', async (req, res) => {

  try {

    const {
      nombre,
      telefono,
      direccion
    } = req.body;


    if (!nombre || !telefono) {

      return res.status(400).json({
        ok: false,

        error:
          'nombre y telefono son obligatorios'
      });

    }


    const resultado =
      await registrarPaciente({
        nombre,
        telefono,
        direccion
      });


    const cliente =
      formatearCliente(
        resultado.paciente
      );


    return res.json({
      ok: true,

      nuevo:
        resultado.nuevo,

      // Nuevo nombre genérico.
      cliente,

      // Lo conservamos temporalmente
      // para no romper n8n/Postman.
      lead:
        cliente
    });

  } catch (error) {

    console.error(
      'Error registrando cliente:',
      error
    );


    return res.status(500).json({
      ok: false,

      error:
        'No fue posible registrar el cliente'
    });

  }

});


module.exports = router;