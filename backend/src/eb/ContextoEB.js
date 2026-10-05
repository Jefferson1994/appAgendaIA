const { nombreCompleto } = require('../utils/texto');
const { ZONA_HORARIA_DEFECTO } = require('../config/constantes');

// Forma del contexto hacia afuera. Mantiene los nombres de campo que ya lee n8n.
class ContextoEB {
  constructor(canal) {
    const { organizacion, profesional } = canal;

    this.canal = {
      id: canal.id,
      tipo: canal.tipo,
      identificador: canal.identificador,
      numeroDestino: canal.numeroDestino
    };

    this.organizacion = {
      id: organizacion.id,
      codigo: organizacion.codigo,
      nombre: organizacion.nombre,
      nombreComercial: organizacion.nombreComercial,
      zonaHoraria: organizacion.zonaHoraria,
      activo: organizacion.activo
    };

    this.profesional = {
      id: profesional.id,
      codigo: profesional.codigo,
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      nombreCompleto: nombreCompleto(profesional),
      tipoProfesional: profesional.tipoProfesional,
      descripcion: profesional.descripcion,
      telefono: profesional.telefono,
      email: profesional.email,
      zonaHoraria: profesional.zonaHoraria,
      intervaloAgendaMinutos: profesional.intervaloAgendaMinutos,
      activo: profesional.activo
    };

    this.contexto = {
      organizacionId: organizacion.id,
      profesionalId: profesional.id,
      canalId: canal.id,
      canalIdentificador: canal.identificador,
      zonaHoraria: profesional.zonaHoraria || organizacion.zonaHoraria || ZONA_HORARIA_DEFECTO
    };
  }
}

module.exports = ContextoEB;