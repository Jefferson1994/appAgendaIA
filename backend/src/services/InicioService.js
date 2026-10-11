const { DateTime } = require('luxon');
const {
  TIPO_ACCESO,
  ALCANCE_ROL,
  ESTADOS_CITA,
  ESTADOS_PAGO,
  ESTADOS_SUSCRIPCION,
  PERIODICIDADES,
  ZONA_HORARIA_DEFECTO,
  MONEDA_DEFECTO,
  ESTADOS_CITA_BLOQUEANTES
} = require('../config/constantes');
const { PERMISOS } = require('../config/permisos');
const { aNumero } = require('../utils/montos');
const AccesoService = require('./AccesoService');
const InicioRepository = require('../repositories/InicioRepository');

// Tablero de Inicio: un resumen del mes para la empresa y uno de toda la plataforma
// para el super admin. Cada bloque de la empresa solo se arma si el usuario puede ver ese dato.

const MESES_SERIE = 6;
const PROXIMAS_CITAS = 5;
const ULTIMAS_EMPRESAS = 5;
const MESES_POR_ANIO = 12;
// Pagos que esperan algo (el pago, revisar el comprobante o conciliarlo).
const PAGOS_PENDIENTES = [ESTADOS_PAGO.PENDIENTE, ESTADOS_PAGO.COMPROBANTE_RECIBIDO, ESTADOS_PAGO.EN_CONCILIACION];

// Mes actual, el anterior y el inicio de la serie, en la zona horaria dada.
function periodos(zona) {
  const ahora = DateTime.now().setZone(zona);
  const mes = ahora.startOf('month');
  return {
    ahora: ahora.toJSDate(),
    hoy: ahora.startOf('day'),
    inicioMes: mes.toJSDate(),
    finMes: mes.plus({ months: 1 }).toJSDate(),
    inicioMesAnterior: mes.minus({ months: 1 }).toJSDate(),
    inicioSerie: mes.minus({ months: MESES_SERIE - 1 }),
    mes: mes.toFormat('yyyy-MM')
  };
}

// Completa con 0 los meses sin datos para que la serie siempre tenga MESES_SERIE puntos.
function serieCompleta(filas, inicioSerie) {
  const porMes = new Map(filas.map((fila) => [fila.mes, Number(fila.total)]));
  return Array.from({ length: MESES_SERIE }, (_, indice) => {
    const mes = inicioSerie.plus({ months: indice }).toFormat('yyyy-MM');
    return { mes, total: porMes.get(mes) || 0 };
  });
}

const contarPor = (items, clave) => {
  const conteo = new Map();
  for (const item of items) {
    const nombre = clave(item);
    if (nombre) conteo.set(nombre, (conteo.get(nombre) || 0) + 1);
  }
  return [...conteo].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
};

// ---------- Empresa ----------

async function bloqueCitas(alcance, p, zona) {
  const [porEstado, anterior, hoy, proximas, serie] = await Promise.all([
    InicioRepository.citasPorEstado(alcance, p.inicioMes, p.finMes),
    InicioRepository.contarCitas(alcance, p.inicioMesAnterior, p.inicioMes, ESTADOS_CITA_BLOQUEANTES),
    InicioRepository.contarCitas(alcance, p.hoy.toJSDate(), p.hoy.plus({ days: 1 }).toJSDate(), ESTADOS_CITA_BLOQUEANTES),
    InicioRepository.proximasCitas(alcance, p.ahora, ESTADOS_CITA_BLOQUEANTES, PROXIMAS_CITAS),
    InicioRepository.citasPorMes(alcance, p.inicioSerie.toJSDate(), zona)
  ]);

  const estados = Object.fromEntries(porEstado.map((fila) => [fila.estado, fila._count._all]));
  // "Agendadas" = las que ocupan agenda (no canceladas ni vencidas), igual que en el mes anterior.
  const total = ESTADOS_CITA_BLOQUEANTES.reduce((suma, estado) => suma + (estados[estado] || 0), 0);

  return {
    total,
    anterior,
    hoy,
    confirmadas: estados[ESTADOS_CITA.CONFIRMADA] || 0,
    atendidas: estados[ESTADOS_CITA.ATENDIDA] || 0,
    pendientes: (estados[ESTADOS_CITA.PENDIENTE_PAGO] || 0) + (estados[ESTADOS_CITA.RESERVA_TEMPORAL] || 0),
    canceladas: (estados[ESTADOS_CITA.CANCELADA] || 0) + (estados[ESTADOS_CITA.NO_ASISTIO] || 0),
    serie: serieCompleta(serie, p.inicioSerie),
    proximas
  };
}

async function bloquePagos(alcance, p, moneda) {
  const [mes, anterior, pendientes] = await Promise.all([
    InicioRepository.cobrado(alcance, p.inicioMes, p.finMes, ESTADOS_PAGO.CONFIRMADO),
    InicioRepository.cobrado(alcance, p.inicioMesAnterior, p.inicioMes, ESTADOS_PAGO.CONFIRMADO),
    InicioRepository.contarPagos(alcance, PAGOS_PENDIENTES)
  ]);
  return {
    cobrado: aNumero(mes._sum.montoRecibido) || 0,
    anterior: aNumero(anterior._sum.montoRecibido) || 0,
    pendientes,
    moneda
  };
}

async function bloqueClientes(organizacionId, p) {
  const [nuevos, anterior, total] = await Promise.all([
    InicioRepository.contarClientes(organizacionId, p.inicioMes, p.finMes),
    InicioRepository.contarClientes(organizacionId, p.inicioMesAnterior, p.inicioMes),
    InicioRepository.contarClientes(organizacionId)
  ]);
  return { nuevos, anterior, total };
}

async function resumenEmpresa(actor) {
  const alcance = AccesoService.resolverAlcance(actor);
  const soloPropio = Boolean(actor.rol && actor.rol.alcance === ALCANCE_ROL.PROPIO);
  const esAdministrador = actor.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA;
  const permisos = new Set(await AccesoService.permisosDe(actor));
  const puede = (codigo) => esAdministrador || permisos.has(codigo);

  const { organizacion } = actor;
  const zona = (organizacion && organizacion.zonaHoraria) || ZONA_HORARIA_DEFECTO;
  const moneda = (organizacion && organizacion.moneda) || MONEDA_DEFECTO;
  const p = periodos(zona);

  // Clientes, equipo y plan son datos de toda la empresa: no los ve quien solo ve lo suyo.
  const [citas, pagos, clientes, equipo, plan] = await Promise.all([
    puede(PERMISOS.CITAS_VER) ? bloqueCitas(alcance, p, zona) : null,
    puede(PERMISOS.PAGOS_VER) ? bloquePagos(alcance, p, moneda) : null,
    puede(PERMISOS.CLIENTES_VER) && !soloPropio ? bloqueClientes(alcance.organizacionId, p) : null,
    esAdministrador ? InicioRepository.contarEquipo(alcance.organizacionId) : null,
    esAdministrador ? InicioRepository.planVigente(alcance.organizacionId, ESTADOS_SUSCRIPCION.VIGENTE) : null
  ]);

  return {
    tipo: 'EMPRESA',
    mes: p.mes,
    zona,
    soloPropio,
    citas,
    pagos,
    clientes,
    equipo: equipo ? { usuarios: equipo[0], profesionales: equipo[1] } : null,
    plan: esAdministrador ? (plan ? plan.plan.nombre : null) : undefined
  };
}

// ---------- Plataforma ----------

const redondear = (monto) => Math.round(monto * 100) / 100;

const mensual = ({ precio, periodicidad }) =>
  (aNumero(precio) || 0) / (periodicidad === PERIODICIDADES.ANUAL ? MESES_POR_ANIO : 1);

async function resumenPlataforma() {
  const zona = ZONA_HORARIA_DEFECTO;
  const p = periodos(zona);
  const vigente = ESTADOS_SUSCRIPCION.VIGENTE;

  const [activas, nuevas, anteriores, usuarios, suscripciones, sueltos, conCategoria, serieEmpresas, serieCitas, citasMes, citasAnterior, ultimas] =
    await Promise.all([
      InicioRepository.contarEmpresas(),
      InicioRepository.contarEmpresas(p.inicioMes, p.finMes),
      InicioRepository.contarEmpresas(p.inicioMesAnterior, p.inicioMes),
      InicioRepository.contarUsuariosDeEmpresas(),
      InicioRepository.suscripcionesVigentes(vigente),
      InicioRepository.modulosSueltosVigentes(p.ahora),
      InicioRepository.empresasConCategoria(),
      InicioRepository.empresasPorMes(p.inicioSerie.toJSDate(), zona),
      InicioRepository.citasPorMes({}, p.inicioSerie.toJSDate(), zona),
      InicioRepository.contarCitasPlataforma(p.inicioMes, p.finMes),
      InicioRepository.contarCitasPlataforma(p.inicioMesAnterior, p.inicioMes),
      InicioRepository.ultimasEmpresas(ULTIMAS_EMPRESAS, vigente)
    ]);

  const conPlan = new Set(suscripciones.map((suscripcion) => suscripcion.organizacionId));
  const ingresoSuscripciones = suscripciones.reduce((suma, suscripcion) => suma + mensual(suscripcion), 0);
  const ingresoSueltos = sueltos.reduce((suma, modulo) => suma + mensual(modulo), 0);

  return {
    tipo: 'PLATAFORMA',
    mes: p.mes,
    zona,
    empresas: { activas, nuevas, anterior: anteriores, sinPlan: Math.max(activas - conPlan.size, 0) },
    usuarios,
    // shortcut: suma montos de distintas monedas como si fueran MONEDA_DEFECTO; separar cuando haya otra moneda.
    ingresos: {
      mensual: redondear(ingresoSuscripciones + ingresoSueltos),
      suscripciones: redondear(ingresoSuscripciones),
      modulosSueltos: redondear(ingresoSueltos),
      moneda: MONEDA_DEFECTO
    },
    citas: { total: citasMes, anterior: citasAnterior },
    planes: contarPor(suscripciones, (suscripcion) => suscripcion.plan.nombre),
    categorias: contarPor(conCategoria, (empresa) =>
      empresa.categoria ? (empresa.categoria.padre ? empresa.categoria.padre.nombre : empresa.categoria.nombre) : null
    ),
    series: { empresas: serieCompleta(serieEmpresas, p.inicioSerie), citas: serieCompleta(serieCitas, p.inicioSerie) },
    ultimas
  };
}

/** Resumen según quién lo pide: la plataforma (super admin) o su empresa. */
function resumen(actor) {
  return actor.tipoAcceso === TIPO_ACCESO.SUPER_ADMIN ? resumenPlataforma() : resumenEmpresa(actor);
}

module.exports = { resumen };
