const prisma = require('../../shared/prisma');


// =====================================================
// Utilidad para errores controlados
// =====================================================

function crearError(
  mensaje,
  statusCode = 400,
  codigo = 'ERROR_SERVICIOS'
) {
  const error = new Error(mensaje);

  error.statusCode = statusCode;
  error.codigo = codigo;

  return error;
}


// =====================================================
// Obtener profesional
// =====================================================

async function obtenerProfesional(
  profesionalId
) {

  if (!profesionalId) {
    throw crearError(
      'profesionalId es obligatorio',
      400,
      'PROFESIONAL_REQUERIDO'
    );
  }


  const id =
    Number(profesionalId);


  if (!Number.isInteger(id) || id <= 0) {
    throw crearError(
      'profesionalId no es válido',
      400,
      'PROFESIONAL_INVALIDO'
    );
  }


  const profesional =
    await prisma.profesional.findFirst({

      where: {
        id,

        activo: true,

        organizacion: {
          activo: true
        }
      },

      include: {
        organizacion: true
      }

    });


  if (!profesional) {
    throw crearError(
      'Profesional no encontrado',
      404,
      'PROFESIONAL_NO_ENCONTRADO'
    );
  }


  return profesional;
}


// =====================================================
// Convertir relación BD -> respuesta API
// =====================================================

function mapearServicio(
  profesionalServicio,
  profesional
) {

  const servicio =
    profesionalServicio.servicio;


  const precio =
    profesionalServicio.precioPersonalizado
    ??
    servicio.precio;


  const duracionMinutos =
    profesionalServicio
      .duracionPersonalizadaMinutos
    ??
    servicio.duracionMinutos;


  return {

    id:
      servicio.id,

    codigo:
      servicio.codigo,

    nombre:
      servicio.nombre,

    descripcion:
      servicio.descripcion,

    precio:
      Number(precio),

    duracion_min:
      duracionMinutos,

    requiere_pago_previo:
      servicio.requierePagoPrevio,

    porcentaje_anticipo:
      servicio.porcentajeAnticipo
        ? Number(
            servicio.porcentajeAnticipo
          )
        : null,

    profesional: {

      id:
        profesional.id,

      nombre:
        [
          profesional.nombre,
          profesional.apellido
        ]
          .filter(Boolean)
          .join(' ')

    }

  };

}


// =====================================================
// Obtener todos los servicios del profesional
// =====================================================

async function obtenerServicios(
  profesionalId
) {

  const profesional =
    await obtenerProfesional(
      profesionalId
    );


  const relaciones =
    await prisma.profesionalServicio.findMany({

      where: {

        profesionalId:
          profesional.id,

        activo:
          true,

        servicio: {
          activo: true
        }

      },

      include: {
        servicio: true
      }

    });


  const servicios =
    relaciones.map(
      (relacion) =>
        mapearServicio(
          relacion,
          profesional
        )
    );


  servicios.sort(
    (a, b) =>
      a.nombre.localeCompare(
        b.nombre,
        'es'
      )
  );


  return servicios;
}


// =====================================================
// Buscar servicios del profesional
// =====================================================

async function buscarServicios(
  profesionalId,
  texto
) {

  if (
    !texto ||
    String(texto).trim() === ''
  ) {

    return obtenerServicios(
      profesionalId
    );

  }


  const profesional =
    await obtenerProfesional(
      profesionalId
    );


  const filtro =
    String(texto).trim();


  const relaciones =
    await prisma.profesionalServicio.findMany({

      where: {

        profesionalId:
          profesional.id,

        activo:
          true,

        servicio: {

          activo:
            true,

          OR: [

            {
              nombre: {
                contains:
                  filtro,

                mode:
                  'insensitive'
              }
            },

            {
              descripcion: {
                contains:
                  filtro,

                mode:
                  'insensitive'
              }
            }

          ]

        }

      },

      include: {
        servicio: true
      }

    });


  return relaciones.map(
    (relacion) =>
      mapearServicio(
        relacion,
        profesional
      )
  );
}


// =====================================================
// Buscar servicio por ID
// =====================================================

async function buscarServicioPorId(
  profesionalId,
  servicioId
) {

  const profesional =
    await obtenerProfesional(
      profesionalId
    );


  const idServicio =
    Number(servicioId);


  if (
    !Number.isInteger(idServicio) ||
    idServicio <= 0
  ) {

    throw crearError(
      'servicioId no es válido',
      400,
      'SERVICIO_INVALIDO'
    );

  }


  const relacion =
    await prisma.profesionalServicio.findFirst({

      where: {

        profesionalId:
          profesional.id,

        servicioId:
          idServicio,

        activo:
          true,

        servicio: {
          activo: true
        }

      },

      include: {
        servicio: true
      }

    });


  if (!relacion) {
    return null;
  }


  return mapearServicio(
    relacion,
    profesional
  );
}


// =====================================================
// Exports
// =====================================================

module.exports = {
  obtenerServicios,
  buscarServicios,
  buscarServicioPorId
};