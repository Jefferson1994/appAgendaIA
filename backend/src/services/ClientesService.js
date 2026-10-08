const { AGENDA, ZONA_HORARIA_DEFECTO } = require('../config/constantes');
const AccesoService = require('./AccesoService');
const ClientesRepository = require('../repositories/ClientesRepository');

// Las citas que cuentan en el resumen de un cliente: las confirmadas y las atendidas.
const ESTADOS_RESUMEN = [...AGENDA.FILTROS.CONFIRMADAS, ...AGENDA.FILTROS.ATENDIDAS];

function indexarResumenes(clientes, { totales, pasadas, futuras }) {
  const resumenes = new Map(
    clientes.map((cliente) => [cliente.id, { totalCitas: 0, ultimaCita: null, proximaCita: null }])
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

  return resumenes;
}

async function consultar(usuario, { texto, pagina, tamano }) {
  // Dueño, administrador y recepción ven toda la empresa; un doctor, solo sus clientes.
  const { organizacionId, profesionalId } = AccesoService.resolverAlcance(usuario);
  const zona = (usuario.organizacion && usuario.organizacion.zonaHoraria) || ZONA_HORARIA_DEFECTO;

  const { total, clientes } = await ClientesRepository.listar({
    organizacionId,
    profesionalId,
    texto,
    pagina,
    tamano
  });

  const resumenes =
    clientes.length === 0
      ? new Map()
      : indexarResumenes(
          clientes,
          await ClientesRepository.resumirCitas({
            organizacionId,
            profesionalId,
            clienteIds: clientes.map((cliente) => cliente.id),
            estados: ESTADOS_RESUMEN,
            ahora: new Date()
          })
        );

  return { clientes, resumenes, total, pagina, tamano, zona };
}

module.exports = { consultar };