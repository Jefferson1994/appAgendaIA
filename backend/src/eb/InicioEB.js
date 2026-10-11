const { nombreCompleto } = require('../utils/texto');

// Respuesta de POST /inicio/resumen. `Tipo` = EMPRESA (resumen del mes de su empresa) o
// PLATAFORMA (super admin). En EMPRESA, un bloque en null = el usuario no puede ver ese dato.

const aSerie = (serie) => serie.map(({ mes, total }) => ({ Mes: mes, Total: total }));
const aConteo = (lista) => lista.map(({ nombre, total }) => ({ Nombre: nombre, Total: total }));

function citasEmpresa(citas) {
  if (!citas) return null;
  return {
    Total: citas.total,
    Anterior: citas.anterior,
    Hoy: citas.hoy,
    Confirmadas: citas.confirmadas,
    Atendidas: citas.atendidas,
    Pendientes: citas.pendientes,
    Canceladas: citas.canceladas,
    Serie: aSerie(citas.serie),
    Proximas: citas.proximas.map((cita) => ({
      Id: cita.id,
      FechaInicio: cita.fechaInicio,
      Estado: cita.estado,
      Cliente: nombreCompleto(cita.cliente),
      Servicio: cita.servicio.nombre,
      Profesional: nombreCompleto(cita.profesional)
    }))
  };
}

function empresa(datos) {
  return {
    Tipo: datos.tipo,
    Mes: datos.mes,
    ZonaHoraria: datos.zona,
    SoloPropio: datos.soloPropio,
    Citas: citasEmpresa(datos.citas),
    Pagos: datos.pagos
      ? { Cobrado: datos.pagos.cobrado, Anterior: datos.pagos.anterior, Pendientes: datos.pagos.pendientes, Moneda: datos.pagos.moneda }
      : null,
    Clientes: datos.clientes
      ? { Nuevos: datos.clientes.nuevos, Anterior: datos.clientes.anterior, Total: datos.clientes.total }
      : null,
    Equipo: datos.equipo ? { Usuarios: datos.equipo.usuarios, Profesionales: datos.equipo.profesionales } : null,
    // undefined (no es administrador) no viaja; null = administrador sin plan vigente.
    Plan: datos.plan === undefined ? undefined : datos.plan
  };
}

function plataforma(datos) {
  return {
    Tipo: datos.tipo,
    Mes: datos.mes,
    ZonaHoraria: datos.zona,
    Empresas: {
      Activas: datos.empresas.activas,
      Nuevas: datos.empresas.nuevas,
      Anterior: datos.empresas.anterior,
      SinPlan: datos.empresas.sinPlan
    },
    Usuarios: datos.usuarios,
    Ingresos: {
      Mensual: datos.ingresos.mensual,
      Suscripciones: datos.ingresos.suscripciones,
      ModulosSueltos: datos.ingresos.modulosSueltos,
      Moneda: datos.ingresos.moneda
    },
    Citas: { Total: datos.citas.total, Anterior: datos.citas.anterior },
    Planes: aConteo(datos.planes),
    Categorias: aConteo(datos.categorias),
    Series: { Empresas: aSerie(datos.series.empresas), Citas: aSerie(datos.series.citas) },
    UltimasEmpresas: datos.ultimas.map((org) => ({
      Id: org.id,
      Nombre: org.nombreComercial || org.nombre,
      Categoria: org.categoria ? org.categoria.nombre : null,
      Plan: org.suscripciones[0] ? org.suscripciones[0].plan.nombre : null,
      Activa: org.activo,
      FechaRegistro: org.fechaCreacion
    }))
  };
}

class InicioEB {
  constructor(datos) {
    Object.assign(this, datos.tipo === 'PLATAFORMA' ? plataforma(datos) : empresa(datos));
  }
}

module.exports = InicioEB;
