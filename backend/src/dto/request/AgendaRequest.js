const { DateTime } = require('luxon');
const AppError = require('../../errors/AppError');
const MSG = require('../../config/mensajes');
const { HTTP, AGENDA, ESTADOS_CITA, LONGITUD_MAX } = require('../../config/constantes');
const {
  estaVacio,
  validarIdPositivo,
  validarIdOpcional,
  validarTexto,
  validarTextoOpcional,
  validarBooleano,
  validarOpcion
} = require('../../utils/validaciones');

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const BUSQUEDA_MIN = 2;

const invalido = (campo) => new AppError(MSG.DATO_INVALIDO(campo), HTTP.PETICION_INVALIDA);

function validarFecha(valor, campo) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!FORMATO_FECHA.test(texto) || !DateTime.fromISO(texto, { zone: 'utc' }).isValid) throw invalido(campo);
  return texto;
}

function validarHora(valor, campo) {
  if (typeof valor !== 'string' || !FORMATO_HORA.test(valor)) throw invalido(campo);
  return valor;
}

const empresa = (body) => validarIdOpcional(body.organizacionId, 'organizacionId');

// POST /agenda/opciones. `organizacionId` solo lo usa el super admin.
function validarEmpresa(body = {}) {
  return { organizacionId: empresa(body) };
}

// POST /agenda/disponibilidad
function validarDisponibilidad(body = {}) {
  return {
    organizacionId: empresa(body),
    profesionalId: validarIdPositivo(body.profesionalId, 'profesionalId'),
    servicioId: validarIdPositivo(body.servicioId, 'servicioId'),
    fecha: validarFecha(body.fecha, 'fecha')
  };
}

// POST /agenda/clientes: busca por nombre o teléfono.
function validarBusquedaClientes(body = {}) {
  const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
  if (texto.length < BUSQUEDA_MIN) throw invalido('texto');
  return { organizacionId: empresa(body), texto: validarTexto(texto, 'texto', LONGITUD_MAX.TEXTO) };
}

// Cliente elegido (clienteId) o uno nuevo (nombre y teléfono obligatorios).
function validarCliente(cliente) {
  if (!cliente || typeof cliente !== 'object') throw new AppError(MSG.CLIENTE_DATOS_REQUERIDOS, HTTP.PETICION_INVALIDA);
  if (!estaVacio(cliente.clienteId)) return { clienteId: validarIdPositivo(cliente.clienteId, 'cliente.clienteId') };
  if (estaVacio(cliente.nombre) || estaVacio(cliente.telefono)) {
    throw new AppError(MSG.CLIENTE_DATOS_REQUERIDOS, HTTP.PETICION_INVALIDA);
  }
  return {
    clienteId: null,
    nombre: validarTexto(cliente.nombre, 'cliente.nombre', LONGITUD_MAX.NOMBRE),
    apellido: validarTextoOpcional(cliente.apellido, 'cliente.apellido', LONGITUD_MAX.NOMBRE),
    telefono: validarTexto(String(cliente.telefono), 'cliente.telefono', LONGITUD_MAX.TELEFONO),
    email: validarTextoOpcional(cliente.email, 'cliente.email', LONGITUD_MAX.TEXTO)
  };
}

// POST /agenda/crear. `hora` debe ser uno de los horarios libres de /agenda/disponibilidad.
function validarCrear(body = {}) {
  return {
    organizacionId: empresa(body),
    profesionalId: validarIdPositivo(body.profesionalId, 'profesionalId'),
    servicioId: validarIdPositivo(body.servicioId, 'servicioId'),
    fecha: validarFecha(body.fecha, 'fecha'),
    hora: validarHora(body.hora, 'hora'),
    cliente: validarCliente(body.cliente),
    notas: validarTextoOpcional(body.notas, 'notas', AGENDA.NOTAS_MAX),
    // true = el cliente ya pagó (en el local): queda confirmada aunque el servicio pida pago previo.
    pagoRecibido: validarBooleano(body.pagoRecibido, 'pagoRecibido', false)
  };
}

// POST /agenda/estado
function validarEstado(body = {}) {
  return {
    organizacionId: empresa(body),
    citaId: validarIdPositivo(body.citaId, 'citaId'),
    estado: validarOpcion(body.estado, 'estado', Object.values(ESTADOS_CITA))
  };
}

module.exports = { validarEmpresa, validarDisponibilidad, validarBusquedaClientes, validarCrear, validarEstado };
