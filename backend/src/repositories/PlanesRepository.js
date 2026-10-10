const prisma = require('../shared/prisma');

const POR_ORDEN = [{ orden: 'asc' }, { nombre: 'asc' }];
const CON_MODULOS = { modulos: { include: { modulo: true } } };

function listar(db = prisma) {
  return db.plan.findMany({ orderBy: POR_ORDEN, include: CON_MODULOS });
}

function listarActivos(db = prisma) {
  return db.plan.findMany({ where: { activo: true }, orderBy: POR_ORDEN, include: CON_MODULOS });
}

function buscarPorId(id, db = prisma) {
  return db.plan.findUnique({ where: { id }, include: CON_MODULOS });
}

function contar(db = prisma) {
  return db.plan.count();
}

function crear(datos, db = prisma) {
  return db.plan.create({ data: datos });
}

function actualizar(id, datos, db = prisma) {
  return db.plan.update({ where: { id }, data: datos });
}

// Debe ejecutarse dentro de una transacción (se le pasa "tx" como db).
async function reemplazarModulos(planId, moduloIds, db = prisma) {
  await db.planModulo.deleteMany({ where: { planId } });
  if (moduloIds.length > 0) {
    await db.planModulo.createMany({ data: moduloIds.map((moduloId) => ({ planId, moduloId })) });
  }
}

module.exports = { listar, listarActivos, buscarPorId, contar, crear, actualizar, reemplazarModulos };
