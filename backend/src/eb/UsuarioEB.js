const MenuModuloEB = require('./MenuModuloEB');
// Usuario autenticado tal como lo recibe el front. Nunca incluye passwordHash ni datos internos.
// `permisos` ya viene calculado por AuthService (lista de códigos).
class UsuarioEB {
  constructor(usuario, { permisos = [], menu = [] } = {})  {
    this.Id = usuario.id;
    this.Email = usuario.email;
    this.PersonaId = usuario.persona.id;
    this.TipoIdentificacion = usuario.persona.tipoIdentificacion || null;
    this.Identificacion = usuario.persona.identificacion || null;
    this.Nombres = usuario.persona.nombres;
    this.Apellidos = usuario.persona.apellidos || null;
    this.Telefono = usuario.persona.telefono || null;
    this.TipoAcceso = usuario.tipoAcceso;
    this.EsClaveTemporal = usuario.esClaveTemporal;
    this.ProfesionalId = usuario.profesionalId || null;

    this.Rol = usuario.rol
      ? { Codigo: usuario.rol.codigo, Nombre: usuario.rol.nombre, Alcance: usuario.rol.alcance }
      : null;

    this.Organizacion = usuario.organizacion
      ? {
          Id: usuario.organizacion.id,
          Codigo: usuario.organizacion.codigo,
          Nombre: usuario.organizacion.nombre,
          ZonaHoraria: usuario.organizacion.zonaHoraria
        }
      : null;

    this.Permisos = permisos;
    this.Menu = menu.map((modulo) => new MenuModuloEB(modulo));
  }
}

module.exports = UsuarioEB;