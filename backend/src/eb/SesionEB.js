const UsuarioEB = require('./UsuarioEB');

// Respuesta de login y refresh: los tokens más el usuario con su rol, permisos y menú.
// `acceso` es { permisos, menu }, calculado por AccesoService.
class SesionEB {
  constructor(tokens, usuario, acceso) {
    this.Token = tokens.accessToken;
    this.TokenRefresh = tokens.refreshToken;
    this.TokenType = tokens.tokenType;
    this.ExpiresIn = tokens.expiresIn;
    this.Usuario = new UsuarioEB(usuario, acceso);
  }
}

module.exports = SesionEB;