const { DateTime } = require('luxon');
const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const {
  HTTP,
  AGENDA,
  CATALOGOS,
  ESTADOS_CITA,
  TIPO_ACCESO,
  TRANSACCION_OPCIONES,
  TRANSICIONES_CITA,
  ZONA_HORARIA_DEFECTO
} = require('../config/constantes');
const { horarioEfectivo } = require('../utils/horarios');
const AccesoService = require('./AccesoService');
const CategoriasService = require('./CategoriasService');
const DisponibilidadService = require('./DisponibilidadService');
const CalendarioService = require('./CalendarioService');
const PagosService = require('./PagosService');
const AgendaRepository = require('../repositories/AgendaRepository');
const BloqueosRepository = require('../repositories/BloqueosRepository');
const CatalogosRepository = require('../repositories/CatalogosRepository');
const CitasRepository = require('../repositories/CitasRepository');
const ExcepcionesHorarioRepository = require('../repositories/ExcepcionesHorarioRepository');
const HorariosRepository = require('../repositories/HorariosRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const PacientesRepository = require('../repositories/PacientesRepository');
const PagosRepository = require('../repositories/PagosRepository');
const ProfesionalesRepository = require('../repositories/ProfesionalesRepository');

// Pantalla de agenda: ver las citas por día o semana, crearlas a mano (una llamada, alguien que
// llega al local) y cambiar su estado. Todo queda dentro de la empresa; quien solo ve lo suyo
// (p. ej. un doctor) solo ve y toca sus propias citas.

const zonaDe = (organizacion) => (organizacion && organizacion.zonaHoraria) || ZONA_HORARIA_DEFECTO;
const noEncontrada = () => new AppError(MSG.CITA_AGENDA_NO_ENCONTRADA, HTTP.NO_ENCONTRADO);

function calcularResumen(citas) {
  const cuantas = (estados) => citas.filter((cita) => estados.includes(cita.estado)).length;

  return {
    total: citas.length,
    confirmadas: cuantas(AGENDA.FILTROS.CONFIRMADAS),
    pendientes: cuantas(AGENDA.FILTROS.PENDIENTES),
    atendidas: cuantas(AGENDA.FILTROS.ATENDIDAS)
  };
}

// Profesional o instalación activo de la empresa; si no, como si no existiera.
async function exigirRecursoDeEmpresa(profesionalId, organizacionId, db) {
  const recurso = profesionalId ? await ProfesionalesRepository.buscarActivoPorId(profesionalId, db) : null;
  if (!recurso || recurso.organizacionId !== organizacionId) {
    throw new AppError(MSG.RECURSO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return recurso;
}

/**
 * Listas de la pantalla: estados con su color (catálogo ESTADOS_CITA), los profesionales o
 * instalaciones de la empresa con su horario y servicios, y las empresas (solo super admin).
 */
async function opciones(usuario, { organizacionId }) {
  const esPlataforma = usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;
  const [estados, empresas] = await Promise.all([
    CatalogosRepository.listarItemsActivos(CATALOGOS.ESTADOS_CITA),
    esPlataforma ? OrganizacionesRepository.listarActivas() : null
  ]);
  if (esPlataforma && !organizacionId) {
    return { empresas, estados, recursos: [], horarioEmpresa: [], soloPropio: false, zona: ZONA_HORARIA_DEFECTO };
  }

  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  const { reserva } = await CategoriasService.perfilDeCategoria(organizacion.categoriaId);
  const [recursos, horarioEmpresa] = await Promise.all([
    AgendaRepository.listarRecursos({
      organizacionId: alcance.organizacionId,
      profesionalId: alcance.profesionalId,
      tipos: CategoriasService.tiposRecursoDe(reserva)
    }),
    HorariosRepository.listarDeOrganizacion(alcance.organizacionId)
  ]);

  return {
    empresas,
    estados,
    // Con qué horario atiende cada uno: el suyo dentro del de la empresa, o el de la empresa.
    recursos: recursos.map((recurso) => ({ ...recurso, horarioEfectivo: horarioEfectivo(recurso.horarios, horarioEmpresa) })),
    horarioEmpresa,
    soloPropio: Boolean(alcance.profesionalId),
    zona: zonaDe(organizacion)
  };
}

async function consultar(usuario, { organizacionId, desde, hasta, filtro, profesionalId }) {
  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId, profesionalId });

  const zona = zonaDe(organizacion);
  const primerDia = desde
    ? DateTime.fromISO(desde, { zone: zona })
    : DateTime.now().setZone(zona).startOf('day');
  const ultimoDia = hasta ? DateTime.fromISO(hasta, { zone: zona }) : primerDia;

  const estadosFiltro = AGENDA.FILTROS[filtro];
  // El resumen no depende del filtro elegido: siempre cuenta las citas vigentes.
  const estados = [...new Set([...AGENDA.FILTROS.TODAS, ...estadosFiltro])];

  const [citas, bloqueos] = await Promise.all([
    CitasRepository.listarAgenda({
      organizacionId: alcance.organizacionId,
      profesionalId: alcance.profesionalId,
      desde: primerDia.startOf('day').toJSDate(),
      hasta: ultimoDia.plus({ days: 1 }).startOf('day').toJSDate(),
      estados,
      ahora: new Date()
    }),
    ExcepcionesHorarioRepository.listarBloqueosAgenda({
      organizacionId: alcance.organizacionId,
      profesionalId: alcance.profesionalId,
      desde: DateTime.fromISO(primerDia.toISODate(), { zone: 'utc' }).toJSDate(),
      hasta: DateTime.fromISO(ultimoDia.toISODate(), { zone: 'utc' }).toJSDate()
    })
  ]);

  return {
    citas: citas.filter((cita) => estadosFiltro.includes(cita.estado)),
    bloqueos,
    resumen: calcularResumen(citas.filter((cita) => AGENDA.FILTROS.TODAS.includes(cita.estado))),
    desde: primerDia.toISODate(),
    hasta: ultimoDia.toISODate(),
    zona
  };
}

// Horarios libres de un día para un profesional o instalación y un servicio.
async function disponibilidad(usuario, { organizacionId, profesionalId, servicioId, fecha }) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId, profesionalId });
  await exigirRecursoDeEmpresa(alcance.profesionalId, alcance.organizacionId);

  const resultado = await DisponibilidadService.obtenerDisponibilidad({
    profesionalId: alcance.profesionalId,
    servicioId,
    desde: fecha,
    dias: 1
  });
  const dia = resultado.dias.find((item) => item.fecha === fecha);
  return { horarios: dia ? dia.horarios : [], precio: resultado.precio, duracionMinutos: resultado.duracionMinutos };
}

async function buscarClientes(usuario, { organizacionId, texto }) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  return AgendaRepository.buscarClientes({
    organizacionId: alcance.organizacionId,
    profesionalId: alcance.profesionalId,
    texto,
    maximo: AGENDA.CLIENTES_MAX
  });
}

// Cliente elegido o uno nuevo. El teléfono es único por empresa: si ya existe, se reutiliza
// (así la misma persona no queda dos veces como lead).
async function obtenerCliente(organizacionId, { clienteId, nombre, apellido, telefono, email }, tx) {
  if (clienteId) {
    const cliente = await PacientesRepository.buscarActivoPorId(organizacionId, clienteId, tx);
    if (!cliente) throw new AppError(MSG.CLIENTE_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
    return cliente;
  }
  const existente = await PacientesRepository.buscarPorTelefono(organizacionId, telefono, tx);
  if (existente) return existente;
  return AgendaRepository.crearCliente({ organizacionId, nombre, apellido, telefono, email }, tx);
}

// Mismo criterio que PagosService.calcularSolicitudCobro: sin porcentaje, cobra todo si pide pago previo.
const pidePagoPrevio = (servicio) =>
  servicio.porcentajeAnticipo === null ? servicio.requierePagoPrevio : Number(servicio.porcentajeAnticipo) > 0;

/**
 * Cita creada por el personal. Solo en un horario libre (mismo cálculo que usa el bot).
 * Si el servicio pide pago previo y aún no se pagó, queda pendiente de pago (sin vencimiento:
 * la confirma el personal al recibir el pago); si no, queda confirmada.
 */
async function crear(usuario, datos) {
  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, {
    organizacionId: datos.organizacionId,
    profesionalId: datos.profesionalId
  });
  const { organizacionId, profesionalId } = alcance;

  const inicio = DateTime.fromISO(`${datos.fecha}T${datos.hora}`, { zone: zonaDe(organizacion) });
  if (!inicio.isValid) throw new AppError(MSG.DATO_INVALIDO('hora'), HTTP.PETICION_INVALIDA);
  if (inicio.toMillis() <= Date.now()) throw new AppError(MSG.FECHA_PASADA, HTTP.PETICION_INVALIDA);

  const citaId = await prisma.$transaction(async (tx) => {
    // Una reserva a la vez por profesional o instalación (igual que el bot).
    await BloqueosRepository.bloquearProfesional(tx, profesionalId);
    await exigirRecursoDeEmpresa(profesionalId, organizacionId, tx);

    const libre = await DisponibilidadService.obtenerDisponibilidad({
      profesionalId,
      servicioId: datos.servicioId,
      desde: datos.fecha,
      dias: 1,
      db: tx
    });
    const dia = libre.dias.find((item) => item.fecha === datos.fecha);
    if (!dia || !dia.horarios.some((slot) => slot.inicio === datos.hora)) {
      throw new AppError(MSG.HORARIO_NO_DISPONIBLE, HTTP.CONFLICTO);
    }

    const cliente = await obtenerCliente(organizacionId, datos.cliente, tx);
    const pendiente = pidePagoPrevio(libre.servicio) && !datos.pagoRecibido;

    const cita = await CitasRepository.crear(
      {
        organizacionId,
        profesionalId,
        clienteId: cliente.id,
        servicioId: libre.servicio.id,
        fechaInicio: inicio.toUTC().toJSDate(),
        fechaFin: inicio.plus({ minutes: libre.duracionMinutos }).toUTC().toJSDate(),
        precio: libre.precio,
        duracionMinutos: libre.duracionMinutos,
        estado: pendiente ? ESTADOS_CITA.PENDIENTE_PAGO : ESTADOS_CITA.CONFIRMADA,
        notasCliente: datos.notas
      },
      tx
    );
    if (pendiente) await PagosService.crearSolicitudPendienteParaCita({ ...cita, servicio: libre.servicio }, tx);
    return cita.id;
  }, TRANSACCION_OPCIONES);

  return CitasRepository.buscarParaAgenda(citaId, organizacionId);
}

/**
 * Confirmar (pago recibido), marcar atendida, no asistió o cancelar. Solo los cambios de
 * TRANSICIONES_CITA; confirmar una cita pendiente da por recibidos sus pagos pendientes.
 */
async function cambiarEstado(usuario, { organizacionId, citaId, estado }) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  const cita = await CitasRepository.buscarParaAgenda(citaId, alcance.organizacionId);
  if (!cita || (alcance.profesionalId && cita.profesionalId !== alcance.profesionalId)) throw noEncontrada();

  if (!(TRANSICIONES_CITA[cita.estado] || []).includes(estado)) {
    throw new AppError(MSG.CITA_TRANSICION_INVALIDA, HTTP.CONFLICTO);
  }

  await prisma.$transaction(async (tx) => {
    const confirma = estado === ESTADOS_CITA.CONFIRMADA;
    await CitasRepository.actualizar(cita.id, { estado, ...(confirma ? { fechaExpiracionReserva: null } : {}) }, tx);
    if (confirma) await PagosRepository.confirmarPendientesDeCita(cita.id, new Date(), tx);
  }, TRANSACCION_OPCIONES);

  if (estado === ESTADOS_CITA.CONFIRMADA) {
    await CalendarioService.sincronizarCitaConfirmada(cita.id);
  }

  return CitasRepository.buscarParaAgenda(cita.id, alcance.organizacionId);
}

module.exports = { opciones, consultar, disponibilidad, buscarClientes, crear, cambiarEstado };
