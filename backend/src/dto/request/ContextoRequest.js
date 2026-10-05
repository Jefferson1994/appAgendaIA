const { validarTexto } = require('../../utils/validaciones');

// GET /contexto/canal/:identificador
function validarCanal(params = {}) {
  return {
    identificador: validarTexto(params.identificador, 'identificador del canal')
  };
}

module.exports = { validarCanal };