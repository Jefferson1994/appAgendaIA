const AgendaService = require('../services/AgendaService');
const ConsultaAgendaRequest = require('../dto/request/ConsultaAgendaRequest');
const AgendaRequest = require('../dto/request/AgendaRequest');
const AgendaEB = require('../eb/AgendaEB');
const AgendaOpcionesEB = require('../eb/AgendaOpcionesEB');
const CitaAgendaEB = require('../eb/CitaAgendaEB');
const MSG = require('../config/mensajes');
const { HTTP } = require('../config/constantes');
const { ok } = require('../utils/respuesta');

// Requieren autenticar, que deja al usuario cargado en req.usuario.

async function consultar(req, res) {
  const filtros = ConsultaAgendaRequest.validarConsultaAgenda(req.body);
  const agenda = await AgendaService.consultar(req.usuario, filtros);

  return ok(res, new AgendaEB(agenda), MSG.AGENDA_OK);
}

async function opciones(req, res) {
  const filtros = AgendaRequest.validarEmpresa(req.body);
  return ok(res, new AgendaOpcionesEB(await AgendaService.opciones(req.usuario, filtros)), MSG.AGENDA_OPCIONES_OK);
}

async function disponibilidad(req, res) {
  const filtros = AgendaRequest.validarDisponibilidad(req.body);
  const { horarios, precio, duracionMinutos } = await AgendaService.disponibilidad(req.usuario, filtros);
  return ok(
    res,
    { Horarios: horarios.map((slot) => ({ Inicio: slot.inicio, Fin: slot.fin })), Precio: precio, DuracionMinutos: duracionMinutos },
    MSG.AGENDA_DISPONIBILIDAD_OK
  );
}

async function buscarClientes(req, res) {
  const filtros = AgendaRequest.validarBusquedaClientes(req.body);
  const clientes = await AgendaService.buscarClientes(req.usuario, filtros);
  return ok(
    res,
    clientes.map((cliente) => ({
      Id: cliente.id,
      Nombre: [cliente.nombre, cliente.apellido].filter(Boolean).join(' '),
      Telefono: cliente.telefono,
      Email: cliente.email || null
    })),
    MSG.CLIENTES_OK
  );
}

async function crear(req, res) {
  const datos = AgendaRequest.validarCrear(req.body);
  const cita = await AgendaService.crear(req.usuario, datos);
  return ok(res, new CitaAgendaEB(cita), MSG.CITA_CREADA, HTTP.CREADO);
}

async function cambiarEstado(req, res) {
  const datos = AgendaRequest.validarEstado(req.body);
  return ok(res, new CitaAgendaEB(await AgendaService.cambiarEstado(req.usuario, datos)), MSG.CITA_ESTADO_OK);
}

module.exports = { consultar, opciones, disponibilidad, buscarClientes, crear, cambiarEstado };
