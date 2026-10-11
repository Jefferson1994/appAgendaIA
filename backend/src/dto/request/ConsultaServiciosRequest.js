const { LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto, validarIdPositivo, validarIdOpcional, validarBooleano } = require('../../utils/validaciones');

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';

// POST /servicios/consultar. Todo es opcional.
// La empresa sale del usuario autenticado; solo el super admin la elige con organizacionId.
function validarConsultaServicios(body = {}) {
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    texto: vacio(body.texto) ? null : validarTexto(body.texto, 'texto', LONGITUD_MAX.NOMBRE),
    incluirInactivos: validarBooleano(body.incluirInactivos, 'incluirInactivos', false),
    profesionalId: vacio(body.profesionalId) ? null : validarIdPositivo(body.profesionalId, 'profesionalId')
  };
}

// POST /servicios/opciones
function validarOpcionesServicios(body = {}) {
  return { organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId') };
}

module.exports = { validarConsultaServicios, validarOpcionesServicios };