const prisma =
  require('../../shared/prisma');


// =====================================================
// Utilidad para errores controlados
// =====================================================

function crearError(
  mensaje,
  statusCode = 400,
  codigo = 'ERROR_CLIENTE'
) {

  const error =
    new Error(mensaje);

  error.statusCode =
    statusCode;

  error.codigo =
    codigo;

  return error;
}


// =====================================================
// Normalizar y validar organización
// =====================================================

async function obtenerOrganizacion(
  organizacionId
) {

  if (!organizacionId) {

    throw crearError(
      'organizacionId es obligatorio',
      400,
      'ORGANIZACION_REQUERIDA'
    );

  }


  const id =
    Number(organizacionId);


  if (
    !Number.isInteger(id)
    ||
    id <= 0
  ) {

    throw crearError(
      'organizacionId no es válido',
      400,
      'ORGANIZACION_INVALIDA'
    );

  }


  const organizacion =
    await prisma.organizacion.findFirst({

      where: {

        id,

        activo: true

      }

    });


  if (!organizacion) {

    throw crearError(
      'Organización no encontrada',
      404,
      'ORGANIZACION_NO_ENCONTRADA'
    );

  }


  return organizacion;
}


// =====================================================
// Normalizar teléfono
// =====================================================

function normalizarTelefono(
  telefono
) {

  if (!telefono) {

    throw crearError(
      'telefono es obligatorio',
      400,
      'TELEFONO_REQUERIDO'
    );

  }


  const telefonoNormalizado =
    String(telefono).trim();


  if (!telefonoNormalizado) {

    throw crearError(
      'telefono no es válido',
      400,
      'TELEFONO_INVALIDO'
    );

  }


  return telefonoNormalizado;
}


// =====================================================
// Listar clientes de UNA organización
// =====================================================

async function leerPacientes(
  organizacionId
) {

  const organizacion =
    await obtenerOrganizacion(
      organizacionId
    );


  return prisma.cliente.findMany({

    where: {

      organizacionId:
        organizacion.id,

      activo:
        true

    },

    orderBy: {
      fechaCreacion:
        'desc'
    }

  });
}


// =====================================================
// Buscar cliente por teléfono dentro de una organización
// =====================================================

async function buscarPacientePorTelefono(
  organizacionId,
  telefono
) {

  const organizacion =
    await obtenerOrganizacion(
      organizacionId
    );


  const telefonoNormalizado =
    normalizarTelefono(
      telefono
    );


  return prisma.cliente.findUnique({

    where: {

      organizacionId_telefono: {

        organizacionId:
          organizacion.id,

        telefono:
          telefonoNormalizado

      }

    }

  });
}


// =====================================================
// Registrar cliente
// =====================================================

async function registrarPaciente({

  organizacionId,

  nombre,

  telefono,

  direccion

}) {

  const organizacion =
    await obtenerOrganizacion(
      organizacionId
    );


  if (
    !nombre
    ||
    String(nombre).trim() === ''
  ) {

    throw crearError(
      'nombre es obligatorio',
      400,
      'NOMBRE_REQUERIDO'
    );

  }


  const telefonoNormalizado =
    normalizarTelefono(
      telefono
    );


  const nombreNormalizado =
    String(nombre).trim();


  const direccionNormalizada =

    direccion
    &&
    String(direccion).trim() !== ''
    &&
    String(direccion).trim() !== 'N/D'

      ? String(direccion).trim()

      : null;


  // ===================================================
  // Revisar si ya existe dentro de ESA organización
  // ===================================================

  const existente =
    await prisma.cliente.findUnique({

      where: {

        organizacionId_telefono: {

          organizacionId:
            organizacion.id,

          telefono:
            telefonoNormalizado

        }

      }

    });


  if (existente) {

    return {

      nuevo:
        false,

      paciente:
        existente

    };

  }


  // ===================================================
  // Crear cliente
  // ===================================================

  const cliente =
    await prisma.cliente.create({

      data: {

        organizacionId:
          organizacion.id,

        nombre:
          nombreNormalizado,

        telefono:
          telefonoNormalizado,

        direccion:
          direccionNormalizada,

        activo:
          true

      }

    });


  return {

    nuevo:
      true,

    paciente:
      cliente

  };
}


// =====================================================
// Exports
// =====================================================

module.exports = {

  leerPacientes,

  buscarPacientePorTelefono,

  registrarPaciente

};