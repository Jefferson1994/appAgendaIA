const prisma = require('../shared/prisma');

// Botones (permisos) de la pantalla con su acción y cuántos roles usa cada uno.
const CON_BOTONES = {
  permisos: {
    orderBy: { codigo: 'asc' },
    include: { accion: true, _count: { select: { roles: true } } }
  }
};

function buscarPorCodigo(codigo, db = prisma) {
  return db.pantalla.findUnique({ where: { codigo } });
}

function buscarPorId(id, db = prisma) {
  return db.pantalla.findUnique({ where: { id } });
}

// La ruta no es única en la base, pero sí debe serlo: el front la usa para navegar.
function buscarPorRuta(ruta, db = prisma) {
  return db.pantalla.findFirst({ where: { ruta } });
}

function buscarConBotones(id, db = prisma) {
  return db.pantalla.findUnique({ where: { id }, include: CON_BOTONES });
}

function listarPorModulo(moduloId, db = prisma) {
  return db.pantalla.findMany({
    where: { moduloId },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }]
  });
}

function crear(datos, db = prisma) {
  return db.pantalla.create({ data: datos });
}

// Sirve también para activar o desactivar: actualizar(id, { activo: false })
function actualizar(id, datos, db = prisma) {
  return db.pantalla.update({ where: { id }, data: datos });
}

module.exports = {
  buscarPorCodigo,
  buscarPorId,
  buscarPorRuta,
  buscarConBotones,
  listarPorModulo,
  crear,
  actualizar
};
