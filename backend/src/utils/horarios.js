// Matemática de intervalos de tiempo usada al calcular la disponibilidad.

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

module.exports = { crearFechaHora, seSolapan };