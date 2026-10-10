const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');
const { generarCodigo } = require('../utils/texto');

const CODIGO_PROFESIONAL_MAX_BASE = 40;

// Crea el profesional de una persona que atiende citas en la empresa (el dueño al registrarse,
// o un doctor al crearle su usuario). Toma los datos de la persona para no pedirlos dos veces:
// su cargo (Odontólogo) queda como tipo de profesional y la observación como descripción.
// Siempre corre dentro de la transacción de quien lo llama (`tx`).
function crearDesdePersona({ organizacionId, persona, cargo, observacion, zonaHoraria }, tx) {
  const nombreCompleto = [persona.nombres, persona.apellidos].filter(Boolean).join(' ');

  return ProfesionalesRepository.crear(
    {
      organizacionId,
      codigo: generarCodigo(nombreCompleto, CODIGO_PROFESIONAL_MAX_BASE, 'profesional'),
      nombre: persona.nombres,
      apellido: persona.apellidos || null,
      telefono: persona.telefono || null,
      email: persona.email || null,
      tipoProfesional: cargo || null,
      descripcion: observacion || null,
      ...(zonaHoraria ? { zonaHoraria } : {})
    },
    tx
  );
}

module.exports = { crearDesdePersona };
