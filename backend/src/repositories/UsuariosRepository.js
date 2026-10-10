const prisma = require('../shared/prisma');

const INCLUIR_ACCESO = {
  persona: true,
  organizacion: true,
  cargo: true,
  profesional: true,
  rol: {
    include: {
      permisos: { include: { permiso: { include: { pantalla: true } } } },
      pantallas: true
    }
  }
};

// Lo que muestra la pantalla de usuarios de la empresa.
const INCLUIR_LISTA = { persona: true, rol: true, profesional: true, cargo: true };

function buscarPorEmail(email, db = prisma) {
  return db.usuario.findUnique({ where: { email } });
}

function buscarPorIdExterno(idExterno, db = prisma) {
  return db.usuario.findUnique({ where: { idExterno } });
}

function buscarConAcceso(id, db = prisma) {
  return db.usuario.findUnique({ where: { id }, include: INCLUIR_ACCESO });
}

// Un usuario solo se busca dentro de su empresa: nunca se toca uno de otra organización.
function buscarDeOrganizacion(id, organizacionId, db = prisma) {
  return db.usuario.findFirst({ where: { id, organizacionId }, include: INCLUIR_LISTA });
}

function listarPorOrganizacion(organizacionId, db = prisma) {
  return db.usuario.findMany({
    where: { organizacionId },
    include: INCLUIR_LISTA,
    orderBy: [{ activo: 'desc' }, { persona: { nombres: 'asc' } }]
  });
}

function crear(datos, db = prisma) {
  return db.usuario.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.usuario.update({ where: { id }, data: datos });
}

module.exports = {
  buscarPorEmail,
  buscarPorIdExterno,
  buscarConAcceso,
  buscarDeOrganizacion,
  listarPorOrganizacion,
  crear,
  actualizar
};
