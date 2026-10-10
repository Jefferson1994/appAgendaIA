const { validarIdPositivo } = require('../../utils/validaciones');

// POST /suscripcion/cambiar-plan. La empresa sale del usuario autenticado, nunca del body.
function validarCambiarPlan(body = {}) {
  return { planId: validarIdPositivo(body.planId, 'planId') };
}

// POST /suscripcion/modulos/comprar y /suscripcion/modulos/cancelar
function validarModuloSuelto(body = {}) {
  return { moduloId: validarIdPositivo(body.moduloId, 'moduloId') };
}

module.exports = { validarCambiarPlan, validarModuloSuelto };
