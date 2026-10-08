const prisma = require('../shared/prisma');

function crear(datos, db = prisma) {
  return db.refreshToken.create({ data: datos });
}

function buscarPorHash(tokenHash, db = prisma) {
  return db.refreshToken.findUnique({ where: { tokenHash } });
}

// Marca un refresh como usado; si fue rotado, guarda cual lo reemplazo.
function revocar(id, reemplazadoPorId = null, db = prisma) {
  return db.refreshToken.update({
    where: { id },
    data: { revocadoEn: new Date(), reemplazadoPorId }
  });
}

// Revoca toda la cadena de sesiones (se usa si alguien reutiliza un refresh ya gastado).
function revocarFamilia(familiaId, db = prisma) {
  return db.refreshToken.updateMany({
    where: { familiaId, revocadoEn: null },
    data: { revocadoEn: new Date() }
  });
}

module.exports = { crear, buscarPorHash, revocar, revocarFamilia };