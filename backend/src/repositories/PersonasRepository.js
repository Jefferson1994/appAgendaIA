const prisma = require('../shared/prisma');

function buscarPorIdentificacion(tipoIdentificacion, identificacion, db = prisma) {
  return db.persona.findUnique({
    where: { tipoIdentificacion_identificacion: { tipoIdentificacion, identificacion } }
  });
}

function crear(datos, db = prisma) {
  return db.persona.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.persona.update({ where: { id }, data: datos });
}

module.exports = { buscarPorIdentificacion, crear, actualizar };