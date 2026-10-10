const { TIPO_ACCESO } = require('../config/constantes');
const { nombreCompleto } = require('../utils/texto');

// Un usuario de la empresa tal como lo ve su administrador. Nunca incluye la clave.
class UsuarioEmpresaEB {
  constructor(usuario, { usuarioActualId }) {
    this.Id = usuario.id;
    this.Email = usuario.email;
    this.Nombres = usuario.persona.nombres;
    this.Apellidos = usuario.persona.apellidos || null;
    this.NombreCompleto = [usuario.persona.nombres, usuario.persona.apellidos].filter(Boolean).join(' ');
    this.Telefono = usuario.persona.telefono || null;
    this.TipoIdentificacion = usuario.persona.tipoIdentificacion || null;
    this.Identificacion = usuario.persona.identificacion || null;
    this.EsAdministrador = usuario.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA;
    this.Activo = usuario.activo;
    this.EsClaveTemporal = usuario.esClaveTemporal;
    this.UltimoLogin = usuario.ultimoLogin || null;
    this.Rol = usuario.rol ? { Id: usuario.rol.id, Nombre: usuario.rol.nombre, Alcance: usuario.rol.alcance } : null;
    this.Profesional = usuario.profesional
      ? { Id: usuario.profesional.id, Nombre: nombreCompleto(usuario.profesional) }
      : null;
    this.Cargo = usuario.cargo ? { Id: usuario.cargo.id, Nombre: usuario.cargo.nombre } : null;
    this.CargoObservacion = usuario.cargoObservacion || null;
    this.EsYo = usuario.id === usuarioActualId;
  }
}

module.exports = UsuarioEmpresaEB;
