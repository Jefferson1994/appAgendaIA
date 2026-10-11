const { nombreCompleto } = require('../utils/texto');
const { aFranja } = require('./HorarioEB');

// Respuesta de POST /agenda/opciones: lo que la pantalla necesita para dibujar y crear citas.
class AgendaOpcionesEB {
  constructor({ empresas, estados, recursos, horarioEmpresa, soloPropio, zona }) {
    this.Empresas = empresas
      ? empresas.map((empresa) => ({ Id: empresa.id, Nombre: empresa.nombreComercial || empresa.nombre }))
      : null;
    // Color de cada estado de cita (catálogo ESTADOS_CITA, editable por el super admin).
    this.Estados = estados.map((estado) => ({ Codigo: estado.codigo, Nombre: estado.nombre, Color: estado.color || null }));
    this.Recursos = recursos.map((recurso) => ({
      Id: recurso.id,
      Nombre: nombreCompleto(recurso),
      Tipo: recurso.tipo.codigo,
      IntervaloAgendaMinutos: recurso.intervaloAgendaMinutos,
      // false = usa el horario de la empresa.
      HorarioPropio: recurso.horarios.length > 0,
      Horarios: recurso.horarioEfectivo.map(aFranja),
      Servicios: recurso.servicios.map((asignacion) => ({
        Id: asignacion.servicio.id,
        Nombre: asignacion.servicio.nombre,
        Precio: Number(asignacion.precioPersonalizado ?? asignacion.servicio.precio),
        DuracionMinutos: asignacion.duracionPersonalizadaMinutos ?? asignacion.servicio.duracionMinutos,
        RequierePagoPrevio: asignacion.servicio.requierePagoPrevio
      }))
    }));
    this.HorarioEmpresa = horarioEmpresa.map(aFranja);
    this.SoloPropio = soloPropio;
    this.ZonaHoraria = zona;
  }
}

module.exports = AgendaOpcionesEB;
