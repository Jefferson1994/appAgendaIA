const { AGENDA, TERMINO_CLIENTE_DEFECTO, TIPO_ACCESO, ZONA_HORARIA_DEFECTO } = require('../config/constantes');
const AccesoService = require('./AccesoService');
const CategoriasService = require('./CategoriasService');
const ClientesRepository = require('../repositories/ClientesRepository');
const OrganizacionesRepository = require('../repositories/OrganizacionesRepository');

// Las citas que cuentan en el resumen de un cliente: las confirmadas y las atendidas.
const ESTADOS_RESUMEN = [...AGENDA.FILTROS.CONFIRMADAS, ...AGENDA.FILTROS.ATENDIDAS];

function indexarResumenes(clientes, { totales, pasadas, futuras }, profesionales) {
  const resumenes = new Map(
    clientes.map((cliente) => [cliente.id, { totalCitas: 0, ultimaCita: null, proximaCita: null, profesionales: [] }])
  );

  for (const fila of totales) {
    resumenes.get(fila.clienteId).totalCitas = fila._count._all;
  }
  for (const fila of pasadas) {
    resumenes.get(fila.clienteId).ultimaCita = fila._max.fechaInicio;
  }
  for (const fila of futuras) {
    resumenes.get(fila.clienteId).proximaCita = fila._min.fechaInicio;
  }
  for (const fila of profesionales) {
    resumenes.get(fila.clienteId).profesionales.push(fila.profesional);
  }

  return resumenes;
}

/**
 * Quienes reservaron en la empresa (los leads) con el resumen de sus citas y con quién.
 * Dueño, administrador y recepción ven toda la empresa; un doctor, solo sus clientes.
 * El super admin elige la empresa; hasta entonces solo recibe la lista de empresas.
 */
async function consultar(usuario, { organizacionId, texto, pagina, tamano }) {
  const esPlataforma = usuario.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN;
  const empresas = esPlataforma ? await OrganizacionesRepository.listarActivas() : null;
  const vacio = { clientes: [], resumenes: new Map(), total: 0, pagina, tamano, zona: ZONA_HORARIA_DEFECTO };
  if (esPlataforma && !organizacionId) {
    return { ...vacio, empresas, termino: TERMINO_CLIENTE_DEFECTO, soloPropio: false };
  }

  const { organizacion, alcance } = await AccesoService.resolverEmpresaYAlcance(usuario, { organizacionId });
  const { profesionalId } = alcance;
  const zona = (organizacion && organizacion.zonaHoraria) || ZONA_HORARIA_DEFECTO;
  const { terminoCliente } = await CategoriasService.perfilDeCategoria(organizacion.categoriaId);
  const termino = terminoCliente || TERMINO_CLIENTE_DEFECTO;

  const { total, clientes } = await ClientesRepository.listar({
    organizacionId: alcance.organizacionId,
    profesionalId,
    texto,
    pagina,
    tamano
  });

  const base = { organizacionId: alcance.organizacionId, profesionalId, clienteIds: clientes.map((cliente) => cliente.id) };
  const resumenes =
    clientes.length === 0
      ? new Map()
      : indexarResumenes(
          clientes,
          await ClientesRepository.resumirCitas({ ...base, estados: ESTADOS_RESUMEN, ahora: new Date() }),
          await ClientesRepository.profesionalesDeClientes(base)
        );

  return { clientes, resumenes, total, pagina, tamano, zona, empresas, termino, soloPropio: Boolean(profesionalId) };
}

module.exports = { consultar };
