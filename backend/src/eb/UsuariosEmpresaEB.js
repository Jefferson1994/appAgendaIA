const UsuarioEmpresaEB = require('./UsuarioEmpresaEB');
const { nombreCompleto } = require('../utils/texto');

// Respuesta de POST /usuarios/consultar: usuarios de la empresa, roles asignables y profesionales
// (para enlazar a los usuarios cuyo rol solo ve lo propio).
// `Empresas` solo llega al super admin (para elegir la empresa); para el resto es null.
// `Reserva` y `Cargos` salen del tipo de negocio de la empresa (null/[] hasta elegir empresa).
class UsuariosEmpresaEB {
  constructor({ usuarios, roles, profesionales, empresas = null, reserva = null, cargos = [] }, { usuarioActualId }) {
    this.Reserva = reserva;
    this.Cargos = cargos.map((cargo) => ({ Id: cargo.id, Nombre: cargo.nombre }));
    this.Empresas = empresas
      ? empresas.map((empresa) => ({ Id: empresa.id, Nombre: empresa.nombreComercial || empresa.nombre }))
      : null;
    this.Usuarios = usuarios.map((usuario) => new UsuarioEmpresaEB(usuario, { usuarioActualId }));
    this.Roles = roles.map((rol) => ({
      Id: rol.id,
      Nombre: rol.nombre,
      Descripcion: rol.descripcion || null,
      Alcance: rol.alcance,
      EsPlantilla: rol.organizacionId === null
    }));
    this.Profesionales = profesionales.map((profesional) => ({
      Id: profesional.id,
      Nombre: nombreCompleto(profesional)
    }));
  }
}

module.exports = UsuariosEmpresaEB;
