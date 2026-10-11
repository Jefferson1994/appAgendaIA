const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TRANSACCION_OPCIONES, TIPO_ACCESO, TIPOS_DOCUMENTO, SERVICIOS } = require('../config/constantes');
const { generarCodigo } = require('../utils/texto');
const AccesoService = require('./AccesoService');
const DocumentosService = require('./DocumentosService');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const CategoriasService = require('./CategoriasService');
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

// Fotos elegidas: imágenes de tipo foto de servicio subidas por la misma empresa. null = no cambiar.
async function validarFotos(organizacionId, fotoIds) {
  if (fotoIds === null) return null;
  if (fotoIds.length > SERVICIOS.FOTOS_MAX) {
    throw new AppError(MSG.SERVICIO_FOTOS_MAX(SERVICIOS.FOTOS_MAX), HTTP.PETICION_INVALIDA);
  }
  for (const documentoId of fotoIds) {
    const documento = await DocumentosService.documentoDeEmpresa(documentoId, organizacionId, TIPOS_DOCUMENTO.FOTO_SERVICIO);
    if (!documento) throw new AppError(MSG.SERVICIO_FOTO_INVALIDA, HTTP.PETICION_INVALIDA);
  }
  return fotoIds;
}

// Para el formulario: quién puede ofrecer el servicio y la política de precios de la empresa.
// El super admin recibe además las empresas; hasta que elige una, no hay más datos.
async function opciones(usuario, { organizacionId }) {
  const esPlataforma = usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;
  const empresas = esPlataforma ? await OrganizacionesRepository.listarActivas() : null;
  if (esPlataforma && !organizacionId) {
    return { empresas, profesionales: [], organizacion: null, soloPropio: false, tipos: [] };
  }

  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  const { reserva } = await CategoriasService.perfilDeCategoria(organizacion.categoriaId);
  const tipos = CategoriasService.tiposRecursoDe(reserva);
  // Solo los profesionales o instalaciones que usa el negocio (una cancha: sus canchas).
  const profesionales = (await CatalogoServiciosRepository.listarProfesionalesParaAsignar(alcance.organizacionId)).filter(
    (recurso) => tipos.includes(recurso.tipo.codigo)
  );
  return { empresas, profesionales, organizacion, soloPropio: Boolean(alcance.profesionalId), tipos };
}

async function consultar(usuario, { organizacionId, texto, incluirInactivos, profesionalId }) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId, profesionalId });

  return CatalogoServiciosRepository.listar({
    organizacionId: alcance.organizacionId,
    profesionalId: alcance.profesionalId,
    texto,
    incluirInactivos
  });
}

async function guardar(usuario, datos) {
  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, {
    organizacionId: datos.organizacionId
  });
  const { organizacionId, profesionalId: propio } = alcance;

  if (propio && !organizacion.profesionalesCreanServicios) {
    throw prohibido(MSG.SERVICIOS_PROPIOS_NO_PERMITIDOS);
  }

  const existente = datos.servicioId ? await buscarExistente(organizacionId, datos.servicioId) : null;
  if (existente) {
    exigirEditable(existente, propio);
  }

  const asignaciones = await resolverAsignaciones(alcance, datos);
  exigirPoliticaDePrecios(organizacion, asignaciones);
  const fotoIds = await validarFotos(organizacionId, datos.fotoIds);

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

    if (fotoIds) await CatalogoServiciosRepository.reemplazarFotos(servicio.id, fotoIds, tx);

    return servicio.id;
  }, TRANSACCION_OPCIONES);

  return CatalogoServiciosRepository.buscarPorId(organizacionId, servicioId);
}

async function cambiarEstado(usuario, { organizacionId: elegida, servicioId, activo }) {
  const { alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId: elegida });
  const { organizacionId, profesionalId: propio } = alcance;

  const servicio = await buscarExistente(organizacionId, servicioId);
  exigirEditable(servicio, propio);

  await CatalogoServiciosRepository.actualizar(servicio.id, { activo });
  return CatalogoServiciosRepository.buscarPorId(organizacionId, servicio.id);
}

module.exports = { opciones, consultar, guardar, cambiarEstado };