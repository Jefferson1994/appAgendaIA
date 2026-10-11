const { nombreCompleto } = require('../utils/texto');
const { aFranja } = require('./HorarioEB');

// Un profesional o una instalación, con sus horarios, fotos y cuántos servicios ofrece.
class RecursoEB {
  constructor(recurso) {
    this.Id = recurso.id;
    this.Tipo = { Id: recurso.tipo.id, Codigo: recurso.tipo.codigo, Nombre: recurso.tipo.nombre };
    this.Nombre = recurso.nombre;
    this.Apellido = recurso.apellido || null;
    this.NombreCompleto = nombreCompleto(recurso);
    this.Descripcion = recurso.descripcion || null;
    this.IntervaloAgendaMinutos = recurso.intervaloAgendaMinutos;
    this.Activo = recurso.activo;
    this.FotoIds = recurso.fotos.map((foto) => foto.documentoId);
    this.Horarios = recurso.horarios.map(aFranja);
    this.Servicios = recurso.servicios.length;
    // Correo del usuario que es este profesional (las instalaciones no tienen).
    this.Usuario = recurso.usuarios[0] ? recurso.usuarios[0].email : null;
  }
}

// Respuesta de POST /recursos/consultar. `Empresas` solo llega al super admin.
class RecursosEB {
  constructor({ empresas, recursos, soloPropio, horarioEmpresa }) {
    this.Empresas = empresas
      ? empresas.map((empresa) => ({ Id: empresa.id, Nombre: empresa.nombreComercial || empresa.nombre }))
      : null;
    this.Recursos = recursos.map((recurso) => new RecursoEB(recurso));
    // El usuario solo ve su ficha: puede editarla, no activarla ni desactivarla.
    this.SoloPropio = soloPropio;
    // Cuándo abre la empresa: el horario de cada uno debe caber dentro (vacío = sin límite).
    this.HorarioEmpresa = horarioEmpresa.map(aFranja);
  }
}

module.exports = { RecursoEB, RecursosEB };
