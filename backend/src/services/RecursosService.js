const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const {
  HTTP,
  TIPO_ACCESO,
  TRANSACCION_OPCIONES,
  CATALOGOS,
  TIPOS_RECURSO,
  TIPOS_DOCUMENTO,
  RECURSOS
} = require('../config/constantes');
const { PERMISOS } = require('../config/permisos');
const { generarCodigo } = require('../utils/texto');
const AccesoService = require('./AccesoService');
const CategoriasService = require('./CategoriasService');
const DocumentosService = require('./DocumentosService');
const CatalogosRepository = require('../repositories/CatalogosRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');
const RecursosRepository = require('../repositories/RecursosRepository');
const HorariosRepository = require('../repositories/HorariosRepository');
const { aHoraDb, exigirFranjasValidas, diaFueraDeHorario } = require('../utils/horarios');

// Lo que se reserva en una empresa: profesionales (personas) e instalaciones (canchas, mesas...).
// Cada tipo tiene su pantalla y sus permisos; la empresa solo maneja los tipos de su negocio.

const CODIGO_RECURSO_MAX_BASE = 40;

const PERMISO_POR_TIPO = {
  [TIPOS_RECURSO.PERSONA]: { ver: PERMISOS.PROFESIONALES_VER, gestionar: PERMISOS.PROFESIONALES_GESTIONAR },
  [TIPOS_RECURSO.ESPACIO]: { ver: PERMISOS.INSTALACIONES_VER, gestionar: PERMISOS.INSTALACIONES_GESTIONAR }
};

const invalido = (mensaje) => new AppError(mensaje, HTTP.PETICION_INVALIDA);
const prohibido = () => new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);

async function exigirPermiso(usuario, codigo) {
  const permisos = await AccesoService.permisosDe(usuario);
  if (!permisos.includes(codigo)) throw prohibido();
}

// Empresa, alcance y el tipo (item del catálogo), validando que el negocio de la empresa lo use.
async function contexto(usuario, { organizacionId, tipo }, accion) {
  await exigirPermiso(usuario, PERMISO_POR_TIPO[tipo][accion]);
  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });

  const { reserva } = await CategoriasService.perfilDeCategoria(organizacion.categoriaId);
  if (!CategoriasService.tiposRecursoDe(reserva).includes(tipo)) throw invalido(MSG.RECURSO_TIPO_NO_APLICA);

  const tipoItem = await CatalogosRepository.buscarItemPorCodigo(CATALOGOS.TIPOS_RECURSO, tipo);
  if (!tipoItem) throw new AppError(MSG.CATALOGO_NO_ENCONTRADO, HTTP.ERROR_INTERNO);
  return { organizacion, alcance, tipoItem };
}

// El super admin recibe además las empresas; hasta que elige una, no hay recursos.
async function consultar(usuario, { organizacionId, tipo, incluirInactivos }) {
  const esPlataforma = usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;
  const empresas = esPlataforma ? await OrganizacionesRepository.listarActivas() : null;
  if (esPlataforma && !organizacionId) {
    await exigirPermiso(usuario, PERMISO_POR_TIPO[tipo].ver);
    return { empresas, recursos: [], soloPropio: false, horarioEmpresa: [] };
  }

  const { alcance, tipoItem } = await contexto(usuario, { organizacionId, tipo }, 'ver');
  // Quien solo ve lo suyo (p. ej. un doctor) ve solo su ficha.
  const [recursos, horarioEmpresa] = await Promise.all([
    RecursosRepository.listar({
      organizacionId: alcance.organizacionId,
      tipoId: tipoItem.id,
      profesionalId: alcance.profesionalId,
      incluirInactivos
    }),
    HorariosRepository.listarDeOrganizacion(alcance.organizacionId)
  ]);
  return { empresas, recursos, soloPropio: Boolean(alcance.profesionalId), horarioEmpresa };
}

async function validarFotos(organizacionId, fotoIds) {
  if (fotoIds === null) return null;
  if (fotoIds.length > RECURSOS.FOTOS_MAX) throw invalido(MSG.RECURSO_FOTOS_MAX(RECURSOS.FOTOS_MAX));
  for (const documentoId of fotoIds) {
    const documento = await DocumentosService.documentoDeEmpresa(documentoId, organizacionId, TIPOS_DOCUMENTO.FOTO_RECURSO);
    if (!documento) throw invalido(MSG.RECURSO_FOTO_INVALIDA);
  }
  return fotoIds;
}

/**
 * Crea una instalación o edita un recurso. Los profesionales (personas) no se crean aquí:
 * nacen al crear un usuario "Es profesional"; aquí se editan su descripción, horarios y fotos.
 */
async function guardar(usuario, datos) {
  const { organizacion, alcance, tipoItem } = await contexto(usuario, datos, 'gestionar');
  const organizacionId = alcance.organizacionId;
  const esEspacio = datos.tipo === TIPOS_RECURSO.ESPACIO;

  let actual = null;
  if (datos.recursoId) {
    actual = await RecursosRepository.buscarDeEmpresa(datos.recursoId, organizacionId);
    if (!actual || actual.tipoId !== tipoItem.id) throw new AppError(MSG.RECURSO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
    // Quien solo ve lo suyo solo edita su propia ficha.
    if (alcance.profesionalId && alcance.profesionalId !== actual.id) throw prohibido();
  } else if (!esEspacio) {
    throw invalido(MSG.RECURSO_PERSONA_DESDE_USUARIOS);
  }
  if (esEspacio && !datos.nombre) throw invalido(MSG.CAMPO_OBLIGATORIO('nombre'));

  if (datos.horarios) {
    exigirFranjasValidas(datos.horarios, RECURSOS.FRANJAS_POR_DIA_MAX);
    const fuera = diaFueraDeHorario(datos.horarios, await HorariosRepository.listarDeOrganizacion(organizacionId));
    if (fuera) throw invalido(MSG.HORARIO_FUERA_EMPRESA(fuera));
  }
  const fotoIds = await validarFotos(organizacionId, datos.fotoIds);

  const campos = {
    descripcion: datos.descripcion,
    intervaloAgendaMinutos: datos.intervaloAgendaMinutos,
    // El nombre de una persona sale de su usuario (Mi perfil); el de una instalación, de aquí.
    ...(esEspacio ? { nombre: datos.nombre, apellido: null } : {})
  };

  const id = await prisma.$transaction(async (tx) => {
    const recurso = actual
      ? await RecursosRepository.actualizar(actual.id, campos, tx)
      : await RecursosRepository.crear(
          {
            ...campos,
            organizacionId,
            tipoId: tipoItem.id,
            codigo: generarCodigo(datos.nombre, CODIGO_RECURSO_MAX_BASE, 'recurso'),
            zonaHoraria: organizacion.zonaHoraria
          },
          tx
        );
    if (datos.horarios) {
      await RecursosRepository.reemplazarHorarios(
        recurso.id,
        datos.horarios.map((horario) => ({
          diaSemana: horario.diaSemana,
          horaInicio: aHoraDb(horario.horaInicio),
          horaFin: aHoraDb(horario.horaFin)
        })),
        tx
      );
    }
    if (fotoIds) await RecursosRepository.reemplazarFotos(recurso.id, fotoIds, tx);
    return recurso.id;
  }, TRANSACCION_OPCIONES);

  return RecursosRepository.buscarDeEmpresa(id, organizacionId);
}

// Un recurso inactivo deja de ofrecerse (el bot ya no lo propone); sus citas pasadas se conservan.
async function cambiarEstado(usuario, datos) {
  const { alcance, tipoItem } = await contexto(usuario, datos, 'gestionar');
  const actual = await RecursosRepository.buscarDeEmpresa(datos.recursoId, alcance.organizacionId);
  if (!actual || actual.tipoId !== tipoItem.id) throw new AppError(MSG.RECURSO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  if (alcance.profesionalId) throw prohibido();

  await RecursosRepository.actualizar(actual.id, { activo: datos.activo });
  return RecursosRepository.buscarDeEmpresa(actual.id, alcance.organizacionId);
}

module.exports = { consultar, guardar, cambiarEstado };
