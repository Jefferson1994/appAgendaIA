const prisma =
  require('../../shared/prisma');


const CODIGO_ORGANIZACION =
  'agenda-demo';


// =====================================================
// Obtener organización actual
// =====================================================

async function obtenerOrganizacionActual() {

  const organizacion =
    await prisma.organizacion.findUnique({
      where: {
        codigo:
          CODIGO_ORGANIZACION
      }
    });


  if (!organizacion) {

    throw new Error(
      `No existe la organización ${CODIGO_ORGANIZACION}`
    );

  }


  return organizacion;
}


// =====================================================
// Listar clientes
// =====================================================

async function leerPacientes() {

  const organizacion =
    await obtenerOrganizacionActual();


  return prisma.cliente.findMany({
    where: {
      organizacionId:
        organizacion.id,

      activo: true
    },

    orderBy: {
      fechaCreacion: 'desc'
    }
  });
}


// =====================================================
// Buscar cliente por teléfono
// =====================================================

async function buscarPacientePorTelefono(
  telefono
) {

  const organizacion =
    await obtenerOrganizacionActual();


  return prisma.cliente.findUnique({
    where: {
      organizacionId_telefono: {
        organizacionId:
          organizacion.id,

        telefono:
          telefono.trim()
      }
    }
  });
}


// =====================================================
// Registrar cliente
// =====================================================

async function registrarPaciente({
  nombre,
  telefono,
  direccion
}) {

  const organizacion =
    await obtenerOrganizacionActual();


  const telefonoNormalizado =
    telefono.trim();


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
      nuevo: false,
      paciente: existente
    };

  }


  const cliente =
    await prisma.cliente.create({
      data: {
        organizacionId:
          organizacion.id,

        // Por ahora guardamos el nombre
        // completo en este campo.
        // No intentamos separar apellido
        // automáticamente porque no sería
        // confiable para nombres reales.
        nombre:
          nombre.trim(),

        telefono:
          telefonoNormalizado,

        direccion:
          direccion &&
          direccion !== 'N/D'
            ? direccion.trim()
            : null,

        activo: true
      }
    });


  return {
    nuevo: true,
    paciente: cliente
  };
}


module.exports = {
  leerPacientes,
  buscarPacientePorTelefono,
  registrarPaciente
};