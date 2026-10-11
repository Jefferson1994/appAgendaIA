// Matemática de intervalos de tiempo usada al calcular la disponibilidad y validar horarios.
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');

function crearFechaHora(fechaBase, horaDb) {

  return fechaBase.set({
    hour: horaDb.getUTCHours(),
    minute: horaDb.getUTCMinutes(),
    second: 0,
    millisecond: 0
  });
}

function seSolapan(inicioA, finA, inicioB, finB) {
  return inicioA.toMillis() < finB.toMillis() && finA.toMillis() > inicioB.toMillis();
}

// Las columnas TIME llegan como fechas del 1970-01-01 en UTC (hora local de la empresa, sin zona).
const aHoraDb = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);
const aHHMM = (horaDb) => horaDb.toISOString().slice(11, 16);
const minutosDe = (horaDb) => horaDb.getUTCHours() * 60 + horaDb.getUTCMinutes();
const desdeMinutos = (minutos) => new Date(Date.UTC(1970, 0, 1, 0, minutos));

const invalido = (mensaje) => new AppError(mensaje, HTTP.PETICION_INVALIDA);

// Franjas "HH:mm" de una semana: inicio antes que fin, sin superponerse y con un tope por día.
function exigirFranjasValidas(franjas, maximoPorDia) {
  const porDia = new Map();
  for (const franja of franjas) {
    if (franja.horaInicio >= franja.horaFin) throw invalido(MSG.HORARIO_RANGO_INVALIDO);
    porDia.set(franja.diaSemana, [...(porDia.get(franja.diaSemana) || []), franja]);
  }
  for (const delDia of porDia.values()) {
    if (delDia.length > maximoPorDia) throw invalido(MSG.HORARIO_FRANJAS_MAX(maximoPorDia));
    const ordenadas = [...delDia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    for (let i = 1; i < ordenadas.length; i += 1) {
      if (ordenadas[i].horaInicio < ordenadas[i - 1].horaFin) throw invalido(MSG.HORARIO_SUPERPUESTO);
    }
  }
}

// Primer día en que alguna franja "HH:mm" se sale del horario de la empresa (franjas de la BD),
// o null si todas caben. Una empresa sin horario no limita.
function diaFueraDeHorario(franjas, horarioEmpresa) {
  if (horarioEmpresa.length === 0) return null;
  const fuera = franjas.find(
    (franja) =>
      !horarioEmpresa.some(
        (abierto) =>
          abierto.diaSemana === franja.diaSemana &&
          aHHMM(abierto.horaInicio) <= franja.horaInicio &&
          aHHMM(abierto.horaFin) >= franja.horaFin
      )
  );
  return fuera ? fuera.diaSemana : null;
}

/**
 * Horario con el que atiende un profesional o instalación (franjas de la BD):
 * el suyo recortado al de la empresa; si no tiene uno propio, el de la empresa.
 */
function horarioEfectivo(propio, horarioEmpresa) {
  if (propio.length === 0) return horarioEmpresa;
  if (horarioEmpresa.length === 0) return propio;

  const resultado = [];
  for (const franja of propio) {
    for (const abierto of horarioEmpresa.filter((h) => h.diaSemana === franja.diaSemana)) {
      const inicio = Math.max(minutosDe(franja.horaInicio), minutosDe(abierto.horaInicio));
      const fin = Math.min(minutosDe(franja.horaFin), minutosDe(abierto.horaFin));
      if (inicio < fin) {
        resultado.push({ diaSemana: franja.diaSemana, horaInicio: desdeMinutos(inicio), horaFin: desdeMinutos(fin) });
      }
    }
  }
  return resultado;
}

module.exports = {
  crearFechaHora,
  seSolapan,
  aHoraDb,
  aHHMM,
  exigirFranjasValidas,
  diaFueraDeHorario,
  horarioEfectivo
};
