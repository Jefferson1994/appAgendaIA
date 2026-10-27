const jwt = require('jsonwebtoken');
const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, ZONA_HORARIA_DEFECTO } = require('../config/constantes');
const { cifrar, descifrar } = require('../security/cifrado');
const IntegracionesCalendarioRepository = require('../repositories/IntegracionesCalendarioRepository');
const EventosCalendarioRepository = require('../repositories/EventosCalendarioRepository');

const GOOGLE_AUTORIZAR = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function configuracionOAuth() {
  const clientId = (process.env.GOOGLE_CALENDAR_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '').trim();
  const redirectUri = (process.env.GOOGLE_CALENDAR_REDIRECT_URI || '').trim();
  return clientId && clientSecret && redirectUri ? { clientId, clientSecret, redirectUri } : null;
}

function exigirOAuth() {
  const config = configuracionOAuth();
  if (!config) throw new AppError(MSG.GOOGLE_CALENDAR_SIN_CONFIGURAR, HTTP.NO_DISPONIBLE);
  return config;
}

function secretoEstado() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) throw new AppError(MSG.GOOGLE_CALENDAR_SIN_CONFIGURAR, HTTP.NO_DISPONIBLE);
  return secreto;
}

function exigirProfesional(actor) {
  if (!actor.profesionalId) throw new AppError(MSG.SOLO_PROFESIONALES, HTTP.PROHIBIDO);
  return actor.profesionalId;
}

function urlAutorizacion(actor) {
  const config = exigirOAuth();
  const profesionalId = exigirProfesional(actor);
  const state = jwt.sign(
    { pro: profesionalId, org: actor.organizacionId, tipo: 'google-calendar' },
    secretoEstado(),
    { expiresIn: '10m' }
  );
  const parametros = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPE,
    state
  });
  return `${GOOGLE_AUTORIZAR}?${parametros.toString()}`;
}

async function intercambiarCodigo(code, state) {
  const config = exigirOAuth();
  let datosEstado;
  try {
    datosEstado = jwt.verify(state, secretoEstado());
  } catch {
    throw new AppError(MSG.GOOGLE_CALENDAR_ESTADO_INVALIDO, HTTP.NO_AUTORIZADO);
  }
  if (datosEstado.tipo !== 'google-calendar' || !datosEstado.pro) {
    throw new AppError(MSG.GOOGLE_CALENDAR_ESTADO_INVALIDO, HTTP.NO_AUTORIZADO);
  }

  const respuesta = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    }),
    signal: AbortSignal.timeout(10000)
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !datos.refresh_token) throw new AppError(MSG.GOOGLE_CALENDAR_AUTORIZACION_ERROR, HTTP.NO_DISPONIBLE);

  await IntegracionesCalendarioRepository.guardar({
    profesionalId: datosEstado.pro,
    calendarId: 'primary',
    refreshTokenCifrado: cifrar(datos.refresh_token),
    activo: true
  });
  return { profesionalId: datosEstado.pro, calendarId: 'primary' };
}

async function consultar(actor) {
  const integracion = await IntegracionesCalendarioRepository.consultarPorProfesional(exigirProfesional(actor));
  return integracion
    ? { conectado: integracion.activo, calendarId: integracion.calendarId, proveedor: integracion.proveedor }
    : { conectado: false, calendarId: null, proveedor: 'GOOGLE' };
}

async function renovarAcceso(refreshToken) {
  const config = exigirOAuth();
  const respuesta = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }),
    signal: AbortSignal.timeout(10000)
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !datos.access_token) throw new Error('Google rechazó la renovación del acceso al calendario');
  return datos.access_token;
}

function datosEvento(cita) {
  const zona = cita.profesional.zonaHoraria || cita.organizacion.zonaHoraria || ZONA_HORARIA_DEFECTO;
  const cliente = [cita.cliente.nombre, cita.cliente.apellido].filter(Boolean).join(' ');
  return {
    summary: `${cita.servicio.nombre} — ${cliente}`.slice(0, 1024),
    description: `Cita Agenda IA #${cita.id}\nCliente: ${cliente}\nTeléfono: ${cita.cliente.telefono}\nServicio: ${cita.servicio.nombre}`,
    start: { dateTime: cita.fechaInicio.toISOString(), timeZone: zona },
    end: { dateTime: cita.fechaFin.toISOString(), timeZone: zona },
    extendedProperties: { private: { agendaIaCitaId: String(cita.id) } }
  };
}

async function sincronizarCitaConfirmada(citaId) {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    include: { cliente: true, servicio: true, profesional: true, organizacion: true }
  });
  if (!cita) return { omitido: true };

  const integracion = await IntegracionesCalendarioRepository.buscarActivaPorProfesional(cita.profesionalId);
  if (!integracion) return { omitido: true };

  const previo = await EventosCalendarioRepository.buscarPorCita(cita.id);
  try {
    const accessToken = await renovarAcceso(descifrar(integracion.refreshTokenCifrado));
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(integracion.calendarId)}/events`;
    const url = previo && previo.eventoExternoId ? `${base}/${encodeURIComponent(previo.eventoExternoId)}` : base;
    const respuesta = await fetch(url, {
      method: previo && previo.eventoExternoId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEvento(cita)),
      signal: AbortSignal.timeout(10000)
    });
    const evento = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || !evento.id) throw new Error('Google Calendar no aceptó el evento');

    await EventosCalendarioRepository.guardar({
      citaId: cita.id,
      integracionId: integracion.id,
      eventoExternoId: evento.id,
      estado: 'SINCRONIZADO',
      ultimoError: null,
      fechaSincronizacion: new Date()
    });
    return { sincronizado: true, eventoExternoId: evento.id };
  } catch (error) {
    await EventosCalendarioRepository.guardar({
      citaId: cita.id,
      integracionId: integracion.id,
      eventoExternoId: previo ? previo.eventoExternoId : null,
      estado: 'ERROR',
      ultimoError: error.message.slice(0, 2000),
      fechaSincronizacion: null
    });
    return { sincronizado: false, error: error.message };
  }
}

module.exports = { urlAutorizacion, intercambiarCodigo, consultar, sincronizarCitaConfirmada };
