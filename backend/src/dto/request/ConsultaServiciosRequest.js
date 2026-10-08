const { LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto, validarIdPositivo, validarBooleano } = require('../../utils/validaciones');

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';

// POST /servicios/consultar. Todo es opcional.
// La empresa no viaja en el body: sale del usuario autenticado.
function validarConsultaServicios(body = {}) {
  return {
    texto: vacio(body.texto) ? null : validarTexto(body.texto, 'texto', LONGITUD_MAX.NOMBRE),
    incluirInactivos: validarBooleano(body.incluirInactivos, 'incluirInactivos', false),
    profesionalId: vacio(body.profesionalId) ? null : validarIdPositivo(body.profesionalId, 'profesionalId')
  };
}

module.exports = { validarConsultaServicios };