const { DateTime } = require('luxon');
const {
  DIAS_SEMANA,
  ESTADOS_RESERVA_EXPIRABLES,
  TIPOS_EXCEPCION
} = require('../config/constantes');
const { crearFechaHora, seSolapan } = require('../utils/horarios');
const { capitalizar } = require('../utils/texto');

const tieneHoras = (excepcion) => excepcion.horaInicio && excepcion.horaFin;

const aRango = (fecha, horaInicio, horaFin) => ({
  inicio: crearFechaHora(fecha, horaInicio),
  fin: crearFechaHora(fecha, horaFin)
});

function excepcionesDelDia(excepciones, fechaTexto) {
  return excepciones.filter((e) => e.fecha.toISOString().slice(0, 10) === fechaTexto);
}

// Tramos en los que el profesional atiende ese día: su horario normal
// (salvo bloqueo de día completo) más la disponibilidad extra.
function intervalosDelDia(fecha, horarios, excepcionesDia) {
  const bloqueadoCompleto = excepcionesDia.some(
    (e) => e.tipo === TIPOS_EXCEPCION.BLOQUEO && e.diaCompleto
  );
  const diaSemana = DIAS_SEMANA[fecha.weekday];

  const normales = bloqueadoCompleto
    ? []
    : horarios
        .filter((h) => h.diaSemana === diaSemana)
        .map((h) => aRango(fecha, h.horaInicio, h.horaFin));

  const extras = excepcionesDia
    .filter((e) => e.tipo === TIPOS_EXCEPCION.DISPONIBILIDAD_EXTRA && tieneHoras(e))
    .map((e) => aRango(fecha, e.horaInicio, e.horaFin));

  return [...normales, ...extras];
}

function bloqueosParciales(fecha, excepcionesDia) {
  return excepcionesDia
    .filter((e) => e.tipo === TIPOS_EXCEPCION.BLOQUEO && !e.diaCompleto && tieneHoras(e))
    .map((e) => aRango(fecha, e.horaInicio, e.horaFin));
}

function citaOcupaHorario(cita, inicioSlot, finSlot, zonaHoraria, ahora) {
  // Una reserva que ya expiró no debe bloquear el horario.
  const reservaVencida =
    ESTADOS_RESERVA_EXPIRABLES.includes(cita.estado) &&
    cita.fechaExpiracionReserva &&
    cita.fechaExpiracionReserva <= ahora.toJSDate();

  if (reservaVencida) return false;

  const inicioCita = DateTime.fromJSDate(cita.fechaInicio).setZone(zonaHoraria);
  const finCita = DateTime.fromJSDate(cita.fechaFin).setZone(zonaHoraria);

  return seSolapan(inicioSlot, finSlot, inicioCita, finCita);
}

function generarSlots({ intervalos, bloqueos, citas, duracionMinutos, intervaloMinutos, zonaHoraria, ahora }) {
  const slots = [];

  for (const intervalo of intervalos) {
    let cursor = intervalo.inicio;

    while (cursor.toMillis() < intervalo.fin.toMillis()) {
      const finSlot = cursor.plus({ minutes: duracionMinutos });

      // El servicio debe caber completo dentro del horario disponible.
      if (finSlot.toMillis() > intervalo.fin.toMillis()) break;

      const esPasado = cursor.toMillis() <= ahora.toMillis();

      if (
        !esPasado &&
        !bloqueos.some((b) => seSolapan(cursor, finSlot, b.inicio, b.fin)) &&
        !citas.some((c) => citaOcupaHorario(c, cursor, finSlot, zonaHoraria, ahora))
      ) {
        slots.push({
          inicio: cursor.toFormat('HH:mm'),
          fin: finSlot.toFormat('HH:mm'),
          fechaInicio: cursor.toISO(),
          fechaFin: finSlot.toISO()
        });
      }

      cursor = cursor.plus({ minutes: intervaloMinutos });
    }
  }

  return slots;
}

function unicosOrdenados(slots) {
  const porInicio = new Map();
  for (const slot of slots) {
    porInicio.set(slot.fechaInicio, slot);
  }
  return [...porInicio.values()].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
}

function calcularDias({
  fechaInicial,
  cantidadDias,
  duracionMinutos,
  intervaloMinutos,
  zonaHoraria,
  ahora,
  horarios,
  excepciones,
  citas
}) {
  const dias = [];

  for (let i = 0; i < cantidadDias; i++) {
    const fecha = fechaInicial.plus({ days: i });
    const fechaTexto = fecha.toFormat('yyyy-MM-dd');
    const excepcionesDia = excepcionesDelDia(excepciones, fechaTexto);

    const intervalos = intervalosDelDia(fecha, horarios, excepcionesDia);
    if (intervalos.length === 0) continue;

    const slots = unicosOrdenados(
      generarSlots({
        intervalos,
        bloqueos: bloqueosParciales(fecha, excepcionesDia),
        citas,
        duracionMinutos,
        intervaloMinutos,
        zonaHoraria,
        ahora
      })
    );
    if (slots.length === 0) continue;

    dias.push({
      fecha: fechaTexto,
      dia: capitalizar(fecha.setLocale('es').toFormat('cccc')),
      horarios: slots
    });
  }

  return dias;
}

module.exports = { calcularDias };