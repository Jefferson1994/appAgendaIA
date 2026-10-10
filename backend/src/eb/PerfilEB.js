const { TIPO_ACCESO } = require('../config/constantes');
const { nombreCompleto } = require('../utils/texto');

// Respuesta de POST /perfil/consultar: los datos que el propio usuario puede ver y editar.
class PerfilEB {
  constructor(usuario) {
    const { persona } = usuario;
    this.Email = usuario.email;
    this.Nombres = persona.nombres;
    this.Apellidos = persona.apellidos || null;
    this.Telefono = persona.telefono || null;
    this.TipoIdentificacion = persona.tipoIdentificacion || null;
    this.Identificacion = persona.identificacion || null;
    this.Empresa = usuario.organizacion ? usuario.organizacion.nombre : null;
    this.EsAdministrador = usuario.tipoAcceso === TIPO_ACCESO.ADMIN_EMPRESA;
    this.Rol = usuario.rol ? usuario.rol.nombre : null;
    this.Cargo = usuario.cargo ? usuario.cargo.nombre : null;
    this.Profesional = usuario.profesional
      ? { Id: usuario.profesional.id, Nombre: nombreCompleto(usuario.profesional) }
      : null;
  }
}

module.exports = PerfilEB;
