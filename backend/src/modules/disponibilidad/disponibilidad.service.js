const { DateTime } = require('luxon');
const prisma = require('../../shared/prisma');

const CODIGO_ORGANIZACION = 'agenda-demo';
const CODIGO_PROFESIONAL = 'prof-demo';

const MAPA_DIAS = {
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
  7: 'DOMINGO'
};


// =====================================================
// Utilidades
// =====================================================

function obtenerHoraMinuto(fecha) {
  return {
    hora: fecha.getUTCHours(),
    minuto: fecha.getUTCMinutes()
  };
}


function crearFechaHora(fechaBase, horaDb) {
  const { hora, minuto } =
    obtenerHoraMinuto(horaDb);

  return fechaBase.set({
    hour: hora,
    minute: minuto,
    second: 0,
    millisecond: 0
  });
}


function seSolapan(
  inicioA,
  finA,
  inicioB,
  finB
) {
  return (
    inicioA.toMillis() < finB.toMillis() &&
    finA.toMillis() > inicioB.toMillis()
  );
}


function capitalizar(texto) {
  if (!texto) {
    return texto;
  }

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}


// =====================================================
// Profesional
// =====================================================

async function obtenerProfesional(
  profesionalId
) {
  if (profesionalId) {
    return prisma.profesional.findFirst({
      where: {
        id: Number(profesionalId),
        activo: true
      },
      include: {
        organizacion: true
      }
    });
  }

  return prisma.profesional.findFirst({
    where: {
      codigo: CODIGO_PROFESIONAL,
      activo: true,

      organizacion: {
        codigo: CODIGO_ORGANIZACION,
        activo: true
      }
    },
    include: {
      organizacion: true
    }
  });
}


// =====================================================
// Servicio del profesional
// =====================================================

async function obtenerServicioProfesional(
  profesionalId,
  servicioId
) {
  return prisma.profesionalServicio.findFirst({
    where: {
      profesionalId,
      servicioId: Number(servicioId),
      activo: true,

      servicio: {
        activo: true
      }
    },

    include: {
      servicio: true
    }
  });
}


// =====================================================
// Disponibilidad
// =====================================================

async function obtenerDisponibilidad({
  profesionalId,
  servicioId,
  desde,
  dias = 7
}) {
  const profesional =
    await obtenerProfesional(
      profesionalId
    );


  if (!profesional) {
    const error =
      new Error(
        'Profesional no encontrado'
      );

    error.statusCode = 404;

    throw error;
  }


  const servicioProfesional =
    await obtenerServicioProfesional(
      profesional.id,
      servicioId
    );


  if (!servicioProfesional) {
    const error =
      new Error(
        'El profesional no ofrece ese servicio'
      );

    error.statusCode = 404;

    throw error;
  }


  const servicio =
    servicioProfesional.servicio;


  const duracionMinutos =
    servicioProfesional
      .duracionPersonalizadaMinutos
    ?? servicio.duracionMinutos;


  const precio =
    servicioProfesional
      .precioPersonalizado
    ?? servicio.precio;


  const zonaHoraria =
    profesional.zonaHoraria
    || profesional.organizacion.zonaHoraria
    || 'America/Guayaquil';


  const ahora =
    DateTime.now()
      .setZone(zonaHoraria);


  let fechaInicial;


  if (desde) {
    fechaInicial =
      DateTime.fromISO(
        desde,
        {
          zone: zonaHoraria
        }
      ).startOf('day');


    if (!fechaInicial.isValid) {
      const error =
        new Error(
          'La fecha desde no es válida'
        );

      error.statusCode = 400;

      throw error;
    }
  } else {
    fechaInicial =
      ahora.startOf('day');
  }


  const cantidadDias =
    Math.min(
      Math.max(
        Number(dias) || 7,
        1
      ),
      30
    );


  const fechaFinal =
    fechaInicial
      .plus({
        days: cantidadDias
      })
      .endOf('day');


  // ===================================================
  // Horario recurrente
  // ===================================================

  const horarios =
    await prisma.horarioProfesional.findMany({
      where: {
        profesionalId:
          profesional.id,

        activo: true
      }
    });


  // ===================================================
  // Excepciones
  // ===================================================

  const fechaInicialDb =
    new Date(
      Date.UTC(
        fechaInicial.year,
        fechaInicial.month - 1,
        fechaInicial.day
      )
    );


  const fechaFinalDb =
    new Date(
      Date.UTC(
        fechaFinal.year,
        fechaFinal.month - 1,
        fechaFinal.day
      )
    );


  const excepciones =
    await prisma.excepcionHorario.findMany({
      where: {
        profesionalId:
          profesional.id,

        fecha: {
          gte: fechaInicialDb,
          lte: fechaFinalDb
        }
      }
    });


  // ===================================================
  // Citas existentes
  // ===================================================

  const citas =
    await prisma.cita.findMany({
      where: {
        profesionalId:
          profesional.id,

        fechaInicio: {
          lt:
            fechaFinal
              .toUTC()
              .toJSDate()
        },

        fechaFin: {
          gt:
            fechaInicial
              .toUTC()
              .toJSDate()
        },

        estado: {
          in: [
            'RESERVA_TEMPORAL',
            'PENDIENTE_PAGO',
            'CONFIRMADA',
            'ATENDIDA'
          ]
        }
      },

      select: {
        fechaInicio: true,
        fechaFin: true,

        estado: true,

        fechaExpiracionReserva:
          true
      }
    });


  // ===================================================
  // Generar días
  // ===================================================

  const resultadoDias = [];


  for (
    let i = 0;
    i < cantidadDias;
    i++
  ) {
    const fecha =
      fechaInicial.plus({
        days: i
      });


    const diaSemana =
      MAPA_DIAS[
        fecha.weekday
      ];


    // ===============================================
    // Horarios normales de ese día
    // ===============================================

    const horariosDia =
      horarios.filter(
        (horario) =>
          horario.diaSemana ===
          diaSemana
      );


    const fechaTexto =
      fecha.toFormat(
        'yyyy-MM-dd'
      );


    const excepcionesDia =
      excepciones.filter(
        (excepcion) =>
          excepcion.fecha
            .toISOString()
            .slice(0, 10)
          === fechaTexto
      );


    // ===============================================
    // Bloqueo de día completo
    // ===============================================

    const bloqueadoCompleto =
      excepcionesDia.some(
        (excepcion) =>
          excepcion.tipo ===
            'BLOQUEO'
          &&
          excepcion.diaCompleto
      );


    let intervalos = [];


    if (!bloqueadoCompleto) {
      intervalos =
        horariosDia.map(
          (horario) => ({
            inicio:
              crearFechaHora(
                fecha,
                horario.horaInicio
              ),

            fin:
              crearFechaHora(
                fecha,
                horario.horaFin
              )
          })
        );
    }


    // ===============================================
    // Disponibilidad extra
    // ===============================================

    const extras =
      excepcionesDia.filter(
        (excepcion) =>
          excepcion.tipo ===
            'DISPONIBILIDAD_EXTRA'
          &&
          excepcion.horaInicio
          &&
          excepcion.horaFin
      );


    for (
      const extra of extras
    ) {
      intervalos.push({
        inicio:
          crearFechaHora(
            fecha,
            extra.horaInicio
          ),

        fin:
          crearFechaHora(
            fecha,
            extra.horaFin
          )
      });
    }


    if (
      intervalos.length === 0
    ) {
      continue;
    }


    // ===============================================
    // Bloqueos parciales
    // ===============================================

    const bloqueos =
      excepcionesDia
        .filter(
          (excepcion) =>
            excepcion.tipo ===
              'BLOQUEO'
            &&
            !excepcion.diaCompleto
            &&
            excepcion.horaInicio
            &&
            excepcion.horaFin
        )
        .map(
          (excepcion) => ({
            inicio:
              crearFechaHora(
                fecha,
                excepcion.horaInicio
              ),

            fin:
              crearFechaHora(
                fecha,
                excepcion.horaFin
              )
          })
        );


    const slots = [];


    for (
      const intervalo of intervalos
    ) {
      let cursor =
        intervalo.inicio;


      while (
        cursor.toMillis() <
        intervalo.fin.toMillis()
      ) {
        const finSlot =
          cursor.plus({
            minutes:
              duracionMinutos
          });


        // El servicio debe caber completo
        // dentro del horario disponible.

        if (
          finSlot.toMillis() >
          intervalo.fin.toMillis()
        ) {
          break;
        }


        // No mostrar horas pasadas.

        if (
          cursor.toMillis() <=
          ahora.toMillis()
        ) {
          cursor =
            cursor.plus({
              minutes:
                profesional
                  .intervaloAgendaMinutos
            });

          continue;
        }


        // =============================================
        // ¿Choca con un bloqueo?
        // =============================================

        const chocaConBloqueo =
          bloqueos.some(
            (bloqueo) =>
              seSolapan(
                cursor,
                finSlot,
                bloqueo.inicio,
                bloqueo.fin
              )
          );


        if (chocaConBloqueo) {
          cursor =
            cursor.plus({
              minutes:
                profesional
                  .intervaloAgendaMinutos
            });

          continue;
        }


        // =============================================
        // ¿Choca con una cita?
        // =============================================

        const chocaConCita =
          citas.some(
            (cita) => {

              // Una reserva que ya expiró
              // no debe bloquear el horario.

              if (
                (
                  cita.estado ===
                    'RESERVA_TEMPORAL'
                  ||
                  cita.estado ===
                    'PENDIENTE_PAGO'
                )
                &&
                cita.fechaExpiracionReserva
                &&
                cita.fechaExpiracionReserva
                  <= new Date()
              ) {
                return false;
              }


              const inicioCita =
                DateTime
                  .fromJSDate(
                    cita.fechaInicio
                  )
                  .setZone(
                    zonaHoraria
                  );


              const finCita =
                DateTime
                  .fromJSDate(
                    cita.fechaFin
                  )
                  .setZone(
                    zonaHoraria
                  );


              return seSolapan(
                cursor,
                finSlot,
                inicioCita,
                finCita
              );
            }
          );


        if (!chocaConCita) {
          slots.push({
            inicio:
              cursor.toFormat(
                'HH:mm'
              ),

            fin:
              finSlot.toFormat(
                'HH:mm'
              ),

            fechaInicio:
              cursor.toISO(),

            fechaFin:
              finSlot.toISO()
          });
        }


        cursor =
          cursor.plus({
            minutes:
              profesional
                .intervaloAgendaMinutos
          });
      }
    }


    // ===============================================
    // Eliminar posibles duplicados
    // ===============================================

    const mapaSlots =
      new Map();


    for (
      const slot of slots
    ) {
      mapaSlots.set(
        slot.fechaInicio,
        slot
      );
    }


    const slotsUnicos =
      [...mapaSlots.values()]
        .sort(
          (a, b) =>
            a.fechaInicio
              .localeCompare(
                b.fechaInicio
              )
        );


    if (
      slotsUnicos.length === 0
    ) {
      continue;
    }


    const nombreDia =
      capitalizar(
        fecha
          .setLocale('es')
          .toFormat('cccc')
      );


    resultadoDias.push({
      fecha:
        fechaTexto,

      dia:
        nombreDia,

      horarios:
        slotsUnicos
    });
  }


  return {
    profesional: {
      id:
        profesional.id,

      nombre:
        `${profesional.nombre}` +
        `${profesional.apellido
          ? ` ${profesional.apellido}`
          : ''}`,

      intervalo_agenda_minutos:
        profesional
          .intervaloAgendaMinutos
    },

    servicio: {
      id:
        servicio.id,

      nombre:
        servicio.nombre,

      precio:
        Number(precio),

      duracion_min:
        duracionMinutos
    },

    zona_horaria:
      zonaHoraria,

    dias:
      resultadoDias
  };
}


module.exports = {
  obtenerDisponibilidad
};