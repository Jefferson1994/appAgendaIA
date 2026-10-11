const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, PAGINACION, LONGITUD_MAX } = require('../../config/constantes');
const { validarTexto, validarIdOpcional } = require('../../utils/validaciones');

const vacio = (valor) => valor === null || valor === undefined || String(valor).trim() === '';

function validarEnteroPositivo(valor, campo, defecto, maximo = Number.MAX_SAFE_INTEGER) {
  if (vacio(valor)) {
    return defecto;
  }

  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > maximo) {
    throw new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);
  }
  return numero;
}

// POST /clientes/consultar. Todo es opcional.
// La empresa sale del usuario autenticado; solo el super admin manda `organizacionId`.
function validarConsultaClientes(body = {}) {
  return {
    organizacionId: validarIdOpcional(body.organizacionId, 'organizacionId'),
    texto: vacio(body.texto) ? null : validarTexto(body.texto, 'texto', LONGITUD_MAX.NOMBRE),
    pagina: validarEnteroPositivo(body.pagina, 'pagina', PAGINACION.PAGINA_DEFECTO),
    tamano: validarEnteroPositivo(body.tamano, 'tamano', PAGINACION.TAMANO_DEFECTO, PAGINACION.TAMANO_MAX)
  };
}

module.exports = { validarConsultaClientes };