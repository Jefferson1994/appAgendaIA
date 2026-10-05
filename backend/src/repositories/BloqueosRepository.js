const { LOCK_PROFESIONAL } = require('../config/constantes');

// Una sola reserva a la vez por profesional. El bloqueo se libera solo cuando
// termina la transacción (commit o rollback), así que solo sirve dentro de una.
async function bloquearProfesional(tx, profesionalId) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(
      ${LOCK_PROFESIONAL}::integer,
      ${profesionalId}::integer
    )::text AS bloqueo
  `;
}

module.exports = { bloquearProfesional };