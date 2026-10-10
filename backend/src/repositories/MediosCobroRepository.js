const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { id: 'asc' }];
const DETALLE = { entidad: true, tipoCuenta: true, profesional: true };

// Medios de un dueño: la empresa (profesionalId null) o un profesional. Activos e inactivos.
function listarDe({ organizacionId, profesionalId }, db = prisma) {
  return db.medioCobro.findMany({ where: { organizacionId, profesionalId }, orderBy: POR_ORDEN, include: DETALLE });
}

// Medios de todos los profesionales de la empresa (vista del administrador).
function listarDeProfesionales(organizacionId, db = prisma) {
  return db.medioCobro.findMany({
    where: { organizacionId, profesionalId: { not: null } },
    orderBy: [{ profesionalId: 'asc' }, ...POR_ORDEN],
    include: DETALLE
  });
}

function listarActivosDe({ organizacionId, profesionalId }, db = prisma) {
  return db.medioCobro.findMany({
    where: { organizacionId, profesionalId, activo: true },
    orderBy: POR_ORDEN,
    include: DETALLE
  });
}

// Un medio solo se busca dentro de su dueño: nunca se toca uno de otra empresa u otro profesional.
function buscarDe(id, { organizacionId, profesionalId }, db = prisma) {
  return db.medioCobro.findFirst({ where: { id, organizacionId, profesionalId }, include: DETALLE });
}

function buscarActivoDeEmpresa(id, organizacionId, db = prisma) {
  return db.medioCobro.findFirst({ where: { id, organizacionId, activo: true }, include: { qrDocumento: true } });
}

function crear(datos, db = prisma) {
  return db.medioCobro.create({ data: datos, include: DETALLE });
}

function actualizar(id, datos, db = prisma) {
  return db.medioCobro.update({ where: { id }, data: datos, include: DETALLE });
}

module.exports = {
  listarDe,
  listarDeProfesionales,
  listarActivosDe,
  buscarDe,
  buscarActivoDeEmpresa,
  crear,
  actualizar
};
