// Único punto por el que el resto del sistema usa la identidad.
// Hoy este proveedor autentica con la base propia (JWT local).
// Al integrar Keycloak solo se reemplaza el contenido de ProveedorKeycloak.js,
// respetando el mismo contrato: autenticar, refrescar, cerrarSesion, verificarAccessToken.
module.exports = require('./ProveedorKeycloak');