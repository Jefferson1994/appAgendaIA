const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');
const CatalogosRepository = require('../repositories/CatalogosRepository');
const { CATALOGOS, TIPOS_RECURSO } = require('../config/constantes');
const { generarCodigo } = require('../utils/texto');

const CODIGO_PROFESIONAL_MAX_BASE = 40;

// Crea el profesional de una persona que atiende citas en la empresa (el dueño al registrarse,
// o un doctor al crearle su usuario). Toma los datos de la persona para no pedirlos dos veces:
// su cargo (Odontólogo) queda como tipo de profesional y la observación como descripción.
// Siempre corre dentro de la transacción de quien lo llama (`tx`).
async function crearDesdePersona({ organizacionId, persona, cargo, observacion, zonaHoraria }, tx) {
  const nombreCompleto = [persona.nombres, persona.apellidos].filter(Boolean).join(' ');
  const tipo = await CatalogosRepository.buscarItemPorCodigo(CATALOGOS.TIPOS_RECURSO, TIPOS_RECURSO.PERSONA, tx);

  return ProfesionalesRepository.crear(
    {
      organizacionId,
      tipoId: tipo.id,
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
