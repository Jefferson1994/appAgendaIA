const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TRANSACCION_OPCIONES } = require('../config/constantes');
const { generarCodigo } = require('../utils/texto');
const AccesoService = require('./AccesoService');
const CatalogoServiciosRepository = require('../repositories/CatalogoServiciosRepository');

const CODIGO_SERVICIO_MAX_BASE = 60;

const prohibido = (mensaje) => new AppError(mensaje, HTTP.PROHIBIDO);

// Un profesional con alcance PROPIO solo toca los servicios que ofrece únicamente él.
function exigirEditable(servicio, profesionalPropio) {
  if (!profesionalPropio) {
    return;
  }

  const soloMio =
    servicio.profesionales.length > 0 &&
    servicio.profesionales.every((asignacion) => asignacion.profesionalId === profesionalPropio);

  if (!soloMio) {
    throw prohibido(MSG.SERVICIO_COMPARTIDO);
  }
}

// El precio o la duración propios de un profesional solo valen si la empresa lo permite.
function exigirPoliticaDePrecios(organizacion, asignaciones) {
  const conValorPropio = (asignaciones || []).some(
    (asignacion) =>
      asignacion.precioPersonalizado !== null || asignacion.duracionPersonalizadaMinutos !== null
  );

  if (conValorPropio && !organizacion.preciosPorProfesional) {
    throw new AppError(MSG.PRECIOS_PROPIOS_NO_PERMITIDOS, HTTP.PETICION_INVALIDA);
  }
}

// Quiénes ofrecerán el servicio. null significa "no cambiar las asignaciones".
async function resolverAsignaciones({ organizacionId, profesionalId: propio }, datos) {
  if (propio) {
    const mia = (datos.profesionales || []).find((asignacion) => asignacion.profesionalId === propio);
    return [
      {
        profesionalId: propio,
        precioPersonalizado: mia ? mia.precioPersonalizado : null,
        duracionPersonalizadaMinutos: mia ? mia.duracionPersonalizadaMinutos : null
      }
    ];
  }

  if (datos.todosLosProfesionales) {
    const activos = await CatalogoServiciosRepository.listarProfesionalesActivos(organizacionId);
    return activos.map((profesional) => ({
      profesionalId: profesional.id,
      precioPersonalizado: null,
      duracionPersonalizadaMinutos: null
    }));
  }

  if (!datos.profesionales) {
    return null;
  }

  const ids = datos.profesionales.map((asignacion) => asignacion.profesionalId);
  const validos = await CatalogoServiciosRepository.listarProfesionalesActivos(organizacionId, ids);
  if (validos.length !== ids.length) {
    throw new AppError(MSG.PROFESIONAL_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return datos.profesionales;
}

async function buscarExistente(organizacionId, servicioId) {
  const servicio = await CatalogoServiciosRepository.buscarPorId(organizacionId, servicioId);
  if (!servicio) {
    throw new AppError(MSG.SERVICIO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  }
  return servicio;
}

async function consultar(usuario, { texto, incluirInactivos, profesionalId }) {
  const alcance = AccesoService.resolverAlcance(usuario, profesionalId);

  return CatalogoServiciosRepository.listar({
    organizacionId: alcance.organizacionId,
    profesionalId: alcance.profesionalId,
    texto,
    incluirInactivos
  });
}

async function guardar(usuario, datos) {
  const alcance = AccesoService.resolverAlcance(usuario);
  const { organizacionId, profesionalId: propio } = alcance;
  const { organizacion } = usuario;

  if (propio && !organizacion.profesionalesCreanServicios) {
    throw prohibido(MSG.SERVICIOS_PROPIOS_NO_PERMITIDOS);
  }

  const existente = datos.servicioId ? await buscarExistente(organizacionId, datos.servicioId) : null;
  if (existente) {
    exigirEditable(existente, propio);
  }

  const asignaciones = await resolverAsignaciones(alcance, datos);
  exigirPoliticaDePrecios(organizacion, asignaciones);

  const campos = {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: datos.precio,
    duracionMinutos: datos.duracionMinutos,
    requierePagoPrevio: datos.requierePagoPrevio,
    porcentajeAnticipo: datos.porcentajeAnticipo
  };

  const servicioId = await prisma.$transaction(async (tx) => {
    const servicio = existente
      ? await CatalogoServiciosRepository.actualizar(existente.id, campos, tx)
      : await CatalogoServiciosRepository.crear(
          { ...campos, organizacionId, codigo: generarCodigo(datos.nombre, CODIGO_SERVICIO_MAX_BASE) },
          tx
        );

    if (asignaciones) {
      // El administrador define la lista completa: quien ya no está en ella deja de ofrecerlo.
      if (existente && !propio) {
        const deseados = new Set(asignaciones.map((asignacion) => asignacion.profesionalId));
        const sobrantes = existente.profesionales
          .map((asignacion) => asignacion.profesionalId)
          .filter((id) => !deseados.has(id));

        if (sobrantes.length > 0) {
          await CatalogoServiciosRepository.quitarAsignaciones(servicio.id, sobrantes, tx);
        }
      }

      for (const asignacion of asignaciones) {
        await CatalogoServiciosRepository.guardarAsignacion(servicio.id, asignacion, tx);
      }
    }

    return servicio.id;
  }, TRANSACCION_OPCIONES);

  return CatalogoServiciosRepository.buscarPorId(organizacionId, servicioId);
}

async function cambiarEstado(usuario, { servicioId, activo }) {
  const { organizacionId, profesionalId: propio } = AccesoService.resolverAlcance(usuario);

  const servicio = await buscarExistente(organizacionId, servicioId);
  exigirEditable(servicio, propio);

  await CatalogoServiciosRepository.actualizar(servicio.id, { activo });
  return CatalogoServiciosRepository.buscarPorId(organizacionId, servicio.id);
}

module.exports = { consultar, guardar, cambiarEstado };