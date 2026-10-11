const { nombreCompleto } = require('../utils/texto');

// Respuesta de POST /servicios/opciones: a quién se puede asignar un servicio y la política
// de precios de la empresa. `Empresas` solo llega al super admin (null para el resto).
class ServiciosOpcionesEB {
  constructor({ empresas, profesionales, organizacion, soloPropio, tipos }) {
    this.Empresas = empresas
      ? empresas.map((empresa) => ({ Id: empresa.id, Nombre: empresa.nombreComercial || empresa.nombre }))
      : null;
    // Profesionales e instalaciones que pueden ofrecer el servicio, con su tipo (PERSONA o ESPACIO).
    this.Profesionales = profesionales.map((profesional) => ({
      Id: profesional.id,
      Nombre: nombreCompleto(profesional),
      Tipo: profesional.tipo.codigo
    }));
    // Tipos que usa el negocio: el formulario dice "Profesionales", "Instalaciones" o ambos.
    this.TiposRecurso = tipos;
    this.PreciosPorProfesional = organizacion ? organizacion.preciosPorProfesional : false;
    this.ProfesionalesCreanServicios = organizacion ? organizacion.profesionalesCreanServicios : false;
    this.SoloPropio = soloPropio;
  }
}

module.exports = ServiciosOpcionesEB;
