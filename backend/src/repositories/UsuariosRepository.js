const prisma = require('../shared/prisma');


const INCLUIR_ACCESO = {
  persona: true,
  organizacion: true,
  rol: {
    include: {
      permisos: { include: { permiso: { include: { pantalla: true } } } },
      pantallas: true
    }
  }
};

function buscarPorEmail(email, db = prisma) {
  return db.usuario.findUnique({ where: { email } });
}

function buscarPorIdExterno(idExterno, db = prisma) {
  return db.usuario.findUnique({ where: { idExterno } });
}

function buscarConAcceso(id, db = prisma) {
  return db.usuario.findUnique({ where: { id }, include: INCLUIR_ACCESO });
}

function crear(datos, db = prisma) {
  return db.usuario.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.usuario.update({ where: { id }, data: datos });
}

module.exports = { buscarPorEmail, buscarPorIdExterno, buscarConAcceso, crear, actualizar };