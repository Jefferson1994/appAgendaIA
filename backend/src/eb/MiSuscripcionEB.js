const PlanEB = require('./PlanEB');
const SuscripcionEB = require('./SuscripcionEB');
const LicenciaModuloEB = require('./LicenciaModuloEB');
const ModuloVentaEB = require('./ModuloVentaEB');

// Respuesta de POST /suscripcion/consultar: plan vigente (null si la empresa no tiene),
// planes que puede contratar, módulos sueltos contratados y disponibles, e historial de planes.
class MiSuscripcionEB {
  constructor({ vigente, historial, planes, contratados, disponibles }) {
    this.PlanVigente = vigente ? { ...new SuscripcionEB(vigente), Modulos: new PlanEB(vigente.plan).Modulos } : null;
    this.Planes = planes.map((plan) => new PlanEB(plan, { esVigente: Boolean(vigente) && vigente.planId === plan.id }));
    this.ModulosContratados = contratados.map((licencia) => new LicenciaModuloEB(licencia));
    this.ModulosDisponibles = disponibles.map((modulo) => new ModuloVentaEB(modulo));
    this.Historial = historial.map((suscripcion) => new SuscripcionEB(suscripcion));
  }
}

module.exports = MiSuscripcionEB;
