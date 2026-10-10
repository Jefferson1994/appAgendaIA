const UsuarioEmpresaEB = require('./UsuarioEmpresaEB');

// Respuesta al crear un usuario o restablecer su clave.
// `ClaveTemporal` solo viaja si no se pudo enviar por correo: el administrador la ve una vez.
class CredencialUsuarioEB {
  constructor({ usuario, correoEnviado, claveTemporal }, { usuarioActualId }) {
    this.Usuario = new UsuarioEmpresaEB(usuario, { usuarioActualId });
    this.CorreoEnviado = correoEnviado;
    this.ClaveTemporal = claveTemporal;
  }
}

module.exports = CredencialUsuarioEB;
