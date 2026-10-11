const { aFranja } = require('./HorarioEB');

// Respuesta de /empresa/consultar y /empresa/horario. `Empresas` solo llega al super admin.
class EmpresaEB {
  constructor({ empresas, organizacion, horarios }) {
    this.Empresas = empresas
      ? empresas.map((empresa) => ({ Id: empresa.id, Nombre: empresa.nombreComercial || empresa.nombre }))
      : null;
    this.Empresa = organizacion
      ? { Id: organizacion.id, Nombre: organizacion.nombreComercial || organizacion.nombre, ZonaHoraria: organizacion.zonaHoraria }
      : null;
    this.Horarios = horarios.map(aFranja);
  }
}

module.exports = EmpresaEB;
