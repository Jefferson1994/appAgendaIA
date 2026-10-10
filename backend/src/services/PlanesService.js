const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TRANSACCION_OPCIONES } = require('../config/constantes');
const ModulosRepository = require('../repositories/ModulosRepository');
const PlanesRepository = require('../repositories/PlanesRepository');

const ERROR_UNICO_PRISMA = 'P2002';

// Módulos que se pueden vender (en un plan o sueltos): activos y que no sean base.
const esVendible = (modulo) => modulo.activo && !modulo.esBase;

// Planes y todos los módulos no base (también los inactivos, marcados con `activo`),
// para que la pantalla muestre los inactivos que un plan ya incluye.
async function consultar() {
  const [planes, modulos] = await Promise.all([PlanesRepository.listar(), ModulosRepository.listar()]);
  return { planes, modulos: modulos.filter((modulo) => !modulo.esBase) };
}

// Los módulos nuevos del plan deben ser vendibles. Un módulo que el plan ya tenía puede
// conservarse aunque se haya desactivado después: no da acceso mientras esté inactivo.
async function exigirModulosValidos(moduloIds, yaIncluidos) {
  if (moduloIds.length === 0) return;
  const modulos = await ModulosRepository.buscarPorIds(moduloIds);
  const valido = (modulo) => !modulo.esBase && (modulo.activo || yaIncluidos.has(modulo.id));

  if (modulos.length !== moduloIds.length || !modulos.every(valido)) {
    throw new AppError(MSG.PLAN_MODULOS_INVALIDOS, HTTP.PETICION_INVALIDA);
  }
}

async function exigirPlan(planId) {
  const plan = await PlanesRepository.buscarPorId(planId);
  if (!plan) throw new AppError(MSG.PLAN_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  return plan;
}

// Crea o edita un plan y reemplaza su lista de módulos, todo en una transacción.
async function guardarPlan({ planId, codigo, moduloIds, ...datos }) {
  const actual = planId ? await exigirPlan(planId) : null;
  const yaIncluidos = new Set(actual ? actual.modulos.map((planModulo) => planModulo.moduloId) : []);
  await exigirModulosValidos(moduloIds, yaIncluidos);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const plan = planId
        ? await PlanesRepository.actualizar(planId, datos, tx)
        : await PlanesRepository.crear({ codigo, ...datos }, tx);
      await PlanesRepository.reemplazarModulos(plan.id, moduloIds, tx);
      return plan.id;
    }, TRANSACCION_OPCIONES);

    return PlanesRepository.buscarPorId(id);
  } catch (error) {
    if (error && error.code === ERROR_UNICO_PRISMA) {
      throw new AppError(MSG.PLAN_CODIGO_DUPLICADO, HTTP.CONFLICTO);
    }
    throw error;
  }
}

// Un plan inactivo ya no se ofrece, pero las empresas suscritas lo conservan.
async function cambiarEstadoPlan({ planId, activo }) {
  await exigirPlan(planId);
  await PlanesRepository.actualizar(planId, { activo });
  return PlanesRepository.buscarPorId(planId);
}

// Precio del módulo vendido suelto. null = no se vende suelto.
async function guardarPrecioModulo({ moduloId, ...precio }) {
  const modulo = await ModulosRepository.buscarPorId(moduloId);
  if (!modulo) throw new AppError(MSG.MODULO_NO_ENCONTRADO, HTTP.NO_ENCONTRADO);
  if (!esVendible(modulo)) throw new AppError(MSG.MODULO_NO_VENDIBLE, HTTP.PETICION_INVALIDA);

  return ModulosRepository.actualizar(moduloId, precio);
}

module.exports = { esVendible, consultar, guardarPlan, cambiarEstadoPlan, guardarPrecioModulo };
