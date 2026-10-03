const prisma = require('../../shared/prisma');


// =====================================================
// Utilidad para errores controlados
// =====================================================

function crearError(
  mensaje,
  statusCode = 400,
  codigo = 'ERROR_CONTEXTO'
) {
  const error = new Error(mensaje);

  error.statusCode = statusCode;
  error.codigo = codigo;

  return error;
}


// =====================================================
// Resolver contexto por identificador de canal
// =====================================================
//
// Ejemplos:
//
// wa-carlos-demo
//      ↓
// Carlos Pérez
// profesionalId = 1
// organizacionId = 1
//
// wa-ana-demo
//      ↓
// Ana López
// profesionalId = 2
// organizacionId = 2
//
// Más adelante el identificador será el
// phone_number_id real entregado por WhatsApp Cloud API.
// =====================================================

async function resolverCanal(identificador) {

  if (
    !identificador ||
    String(identificador).trim() === ''
  ) {
    throw crearError(
      'El identificador del canal es obligatorio',
      400,
      'CANAL_REQUERIDO'
    );
  }


  const identificadorLimpio =
    String(identificador).trim();


  const canal =
    await prisma.canalAtencion.findUnique({

      where: {
        identificador:
          identificadorLimpio
      },

      include: {

        organizacion: true,

        profesional: true

      }

    });


  // ===================================================
  // Validar canal
  // ===================================================

  if (!canal) {
    throw crearError(
      'Canal de atención no encontrado',
      404,
      'CANAL_NO_ENCONTRADO'
    );
  }


  if (!canal.activo) {
    throw crearError(
      'El canal de atención está inactivo',
      403,
      'CANAL_INACTIVO'
    );
  }


  // ===================================================
  // Validar organización
  // ===================================================

  if (!canal.organizacion) {
    throw crearError(
      'El canal no tiene una organización asociada',
      500,
      'ORGANIZACION_NO_ASOCIADA'
    );
  }


  if (!canal.organizacion.activo) {
    throw crearError(
      'La organización asociada al canal está inactiva',
      403,
      'ORGANIZACION_INACTIVA'
    );
  }


  // ===================================================
  // Validar profesional
  // ===================================================

  if (!canal.profesional) {
    throw crearError(
      'El canal no tiene un profesional asociado',
      500,
      'PROFESIONAL_NO_ASOCIADO'
    );
  }


  if (!canal.profesional.activo) {
    throw crearError(
      'El profesional asociado al canal está inactivo',
      403,
      'PROFESIONAL_INACTIVO'
    );
  }


  // ===================================================
  // Resolver zona horaria
  // ===================================================

  const zonaHoraria =
    canal.profesional.zonaHoraria
    ||
    canal.organizacion.zonaHoraria
    ||
    'America/Guayaquil';


  // ===================================================
  // Respuesta limpia
  // ===================================================

  return {

    canal: {

      id:
        canal.id,

      tipo:
        canal.tipo,

      identificador:
        canal.identificador,

      numeroDestino:
        canal.numeroDestino

    },


    organizacion: {

      id:
        canal.organizacion.id,

      codigo:
        canal.organizacion.codigo,

      nombre:
        canal.organizacion.nombre,

      nombreComercial:
        canal.organizacion.nombreComercial,

      zonaHoraria:
        canal.organizacion.zonaHoraria,

      activo:
        canal.organizacion.activo

    },


    profesional: {

      id:
        canal.profesional.id,

      codigo:
        canal.profesional.codigo,

      nombre:
        canal.profesional.nombre,

      apellido:
        canal.profesional.apellido,

      nombreCompleto:
        [
          canal.profesional.nombre,
          canal.profesional.apellido
        ]
          .filter(Boolean)
          .join(' '),

      tipoProfesional:
        canal.profesional.tipoProfesional,

      descripcion:
        canal.profesional.descripcion,

      telefono:
        canal.profesional.telefono,

      email:
        canal.profesional.email,

      zonaHoraria:
        canal.profesional.zonaHoraria,

      intervaloAgendaMinutos:
        canal.profesional.intervaloAgendaMinutos,

      activo:
        canal.profesional.activo

    },


    contexto: {

      organizacionId:
        canal.organizacion.id,

      profesionalId:
        canal.profesional.id,

      canalId:
        canal.id,

      canalIdentificador:
        canal.identificador,

      zonaHoraria

    }

  };

}


// =====================================================
// Exports
// =====================================================

module.exports = {
  resolverCanal
};