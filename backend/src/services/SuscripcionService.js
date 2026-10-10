const prisma = require('../shared/prisma');
const AppError = require('../errors/AppError');
const MSG = require('../config/mensajes');
const { HTTP, TRANSACCION_OPCIONES } = require('../config/constantes');
const CobroSuscripcionesService = require('./CobroSuscripcionesService');
const { esVendible } = require('./PlanesService');
const ModulosRepository = require('../repositories/ModulosRepository');
const PlanesRepository = require('../repositories/PlanesRepository');
const SuscripcionesRepository = require('../repositories/SuscripcionesRepository');
const OrganizacionModulosRepository = require('../repositories/OrganizacionModulosRepository');

const conflicto = (mensaje) => new AppError(mensaje, HTTP.CONFLICTO);

// La empresa siempre sale del usuario autenticado, nunca de lo que mande el cliente.
function empresaDe(usuario) {
  if (!usuario.organizacionId) throw new AppError(MSG.SIN_PERMISO, HTTP.PROHIBIDO);
  return usuario.organizacionId;
}

const modulosDelPlan = (suscripcion) =>
  new Set(suscripcion ? suscripcion.plan.modulos.map((planModulo) => planModulo.moduloId) : []);

// Todo lo que ve el administrador en "Mi suscripción".
async function consultar(usuario) {
  const organizacionId = empresaDe(usuario);
  const ahora = new Date();

  const [vigente, historial, planes, contratados, modulos] = await Promise.all([
    SuscripcionesRepository.buscarVigente(organizacionId, ahora),
    SuscripcionesRepository.listarPorOrganizacion(organizacionId),
    PlanesRepository.listarActivos(),
    OrganizacionModulosRepository.listarVigentes(organizacionId, ahora),
    ModulosRepository.listar()
  ]);

  const enPlan = modulosDelPlan(vigente);
  const yaContratados = new Set(contratados.map((licencia) => licencia.moduloId));
  const disponibles = modulos.filter(
    (modulo) =>
      esVendible(modulo) && modulo.precio !== null && !enPlan.has(modulo.id) && !yaContratados.has(modulo.id)
  );

  return { vigente, historial, planes, contratados, disponibles };
}

// Cambia (o contrata por primera vez) el plan de la empresa. El plan anterior queda
// FINALIZADO en el historial con su fecha de fin, y el nuevo guarda el precio de hoy.
async function cambiarPlan(usuario, { planId }) {
  const organizacionId = empresaDe(usuario);
  const plan = await PlanesRepository.buscarPorId(planId);
  if (!plan || !plan.activo) throw conflicto(MSG.PLAN_NO_DISPONIBLE);

  const ahora = new Date();
  const vigente = await SuscripcionesRepository.buscarVigente(organizacionId, ahora);
  if (vigente && vigente.planId === planId) throw conflicto(MSG.PLAN_YA_VIGENTE);

  const cobro = await CobroSuscripcionesService.iniciarCobro(
    { monto: Number(plan.precio), moneda: plan.moneda, descripcion: plan.nombre },
    ahora
  );

  return prisma.$transaction(async (tx) => {
    // Con pasarela, el plan anterior se finaliza recién cuando se confirma el pago.
    if (CobroSuscripcionesService.daAcceso(cobro)) {
      await SuscripcionesRepository.finalizarAbiertas(organizacionId, ahora, tx);
    }
    return SuscripcionesRepository.crear(
      {
        organizacionId,
        planId,
        precio: plan.precio,
        moneda: plan.moneda,
        periodicidad: plan.periodicidad,
        fechaInicio: ahora,
        fechaFin: null,
        ...cobro
      },
      tx
    );
  }, TRANSACCION_OPCIONES);
}

// Compra un módulo suelto (fuera del plan) al precio de hoy.
async function comprarModulo(usuario, { moduloId }) {
  const organizacionId = empresaDe(usuario);
  const modulo = await ModulosRepository.buscarPorId(moduloId);
  if (!modulo || !esVendible(modulo) || modulo.precio === null) throw conflicto(MSG.MODULO_NO_VENDIBLE);

  const ahora = new Date();
  const vigente = await SuscripcionesRepository.buscarVigente(organizacionId, ahora);
  if (modulosDelPlan(vigente).has(moduloId)) throw conflicto(MSG.MODULO_EN_PLAN);
  if (await OrganizacionModulosRepository.buscarVigente(organizacionId, moduloId, ahora)) {
    throw conflicto(MSG.MODULO_YA_CONTRATADO);
  }

  const cobro = await CobroSuscripcionesService.iniciarCobro(
    { monto: Number(modulo.precio), moneda: modulo.moneda, descripcion: modulo.nombre },
    ahora
  );

  return OrganizacionModulosRepository.guardar({
    organizacionId,
    moduloId,
    activo: CobroSuscripcionesService.daAcceso(cobro),
    fechaInicio: ahora,
    fechaFin: null,
    precio: modulo.precio,
    moneda: modulo.moneda,
    periodicidad: modulo.periodicidad
  });
}

async function cancelarModulo(usuario, { moduloId }) {
  const organizacionId = empresaDe(usuario);
  const ahora = new Date();
  if (!(await OrganizacionModulosRepository.buscarVigente(organizacionId, moduloId, ahora))) {
    throw new AppError(MSG.MODULO_NO_CONTRATADO, HTTP.NO_ENCONTRADO);
  }
  return OrganizacionModulosRepository.cancelar(organizacionId, moduloId, ahora);
}

module.exports = { consultar, cambiarPlan, comprarModulo, cancelarModulo };
