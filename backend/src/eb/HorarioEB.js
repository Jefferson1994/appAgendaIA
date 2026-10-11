const { aHHMM } = require('../utils/horarios');

// Una franja de horario semanal: { DiaSemana: 'LUNES', HoraInicio: '08:00', HoraFin: '12:00' }.
const aFranja = (horario) => ({
  DiaSemana: horario.diaSemana,
  HoraInicio: aHHMM(horario.horaInicio),
  HoraFin: aHHMM(horario.horaFin)
});

module.exports = { aFranja };
