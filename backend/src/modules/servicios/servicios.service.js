const prisma = require('../../shared/prisma');


// =====================================================
// CONFIGURACIÓN TEMPORAL DEL MVP
// =====================================================
//
// Por ahora tenemos una única organización/profesional
// de demostración.
//
// Más adelante estos códigos vendrán del número de
// WhatsApp, dominio, tenant o sesión.
//

const CODIGO_ORGANIZACION = 'agenda-demo';
const CODIGO_PROFESIONAL = 'prof-demo';


// =====================================================
// Obtener profesional actual
// =====================================================

async function obtenerProfesionalActual() {

  return prisma.profesional.findFirst({
    where: {
      codigo: CODIGO_PROFESIONAL,

      activo: true,

      organizacion: {
        codigo: CODIGO_ORGANIZACION,
        activo: true
      }
    }
  });

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
    ?? servicio.precio;


  const duracionMinutos =
    profesionalServicio.duracionPersonalizadaMinutos
    ?? servicio.duracionMinutos;


  return {
    id: servicio.id,

    codigo: servicio.codigo,

    nombre: servicio.nombre,

    descripcion:
      servicio.descripcion,

    precio: Number(precio),

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
      id: profesional.id,

      nombre:
        `${profesional.nombre}` +
        `${profesional.apellido
          ? ` ${profesional.apellido}`
          : ''}`
    }
  };

}


// =====================================================
// Obtener todos los servicios
// =====================================================

async function obtenerServicios() {

  const profesional =
    await obtenerProfesionalActual();


  if (!profesional) {
    return [];
  }


  const relaciones =
    await prisma.profesionalServicio.findMany({
      where: {
        profesionalId:
          profesional.id,

        activo: true,

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
// Buscar servicios
// =====================================================

async function buscarServicios(texto) {

  if (!texto) {
    return obtenerServicios();
  }


  const profesional =
    await obtenerProfesionalActual();


  if (!profesional) {
    return [];
  }


  const filtro =
    texto.trim();


  const relaciones =
    await prisma.profesionalServicio.findMany({
      where: {
        profesionalId:
          profesional.id,

        activo: true,

        servicio: {
          activo: true,

          nombre: {
            contains: filtro,
            mode: 'insensitive'
          }
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

async function buscarServicioPorId(id) {

  const profesional =
    await obtenerProfesionalActual();


  if (!profesional) {
    return null;
  }


  const relacion =
    await prisma.profesionalServicio.findFirst({
      where: {
        profesionalId:
          profesional.id,

        servicioId:
          Number(id),

        activo: true,

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


module.exports = {
  obtenerServicios,
  buscarServicios,
  buscarServicioPorId
};