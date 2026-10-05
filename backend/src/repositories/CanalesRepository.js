const prisma = require('../shared/prisma');

function buscarPorIdentificador(identificador, db = prisma) {
  return db.canalAtencion.findUnique({
    where: { identificador },
    include: { organizacion: true, profesional: true }
  });
}

module.exports = { buscarPorIdentificador };