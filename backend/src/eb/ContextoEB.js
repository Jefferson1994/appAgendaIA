const { nombreCompleto } = require('../utils/texto');
const { ZONA_HORARIA_DEFECTO } = require('../config/constantes');

// Forma del contexto hacia afuera. Mantiene los nombres de campo que ya lee n8n.
class ContextoEB {
  constructor(canal, servicios = []) {
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

    // El flujo conversacional obtiene este contexto una sola vez por mensaje.
    // Incluir el catálogo que corresponde al canal evita que el agente pierda
    // la respuesta de una herramienta adicional y conserva el aislamiento
    // entre profesionales.
    this.servicios = servicios;
  }
}

module.exports = ContextoEB;
