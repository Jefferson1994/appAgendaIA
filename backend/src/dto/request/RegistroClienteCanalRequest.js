const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto } = require('../../utils/validaciones');

const aTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

function normalizarDireccion(valor) {
  const texto = aTexto(valor).trim();
  if (!texto || texto === 'N/D') return null;
  if (texto.length > LONGITUD_MAX.DIRECCION) {
    throw new AppError(MSG.DATO_INVALIDO('direccion'), HTTP.PETICION_INVALIDA);
  }
  return texto;
}

// POST /clientes/registrar. La organización se deriva del canal, nunca del agente.
function validarRegistroPorCanal(body = {}) {
  return {
    canalId: validarTexto(body.canal_id, 'canal_id'),
    nombre: validarTexto(aTexto(body.nombre), 'nombre', LONGITUD_MAX.NOMBRE),
    telefono: validarTexto(aTexto(body.telefono), 'telefono', LONGITUD_MAX.TELEFONO),
    direccion: normalizarDireccion(body.direccion)
  };
}

module.exports = { validarRegistroPorCanal };
