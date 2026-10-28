const prisma = require('../shared/prisma');

async function guardar(mensajes) {
  // Una sola inserción confirma durablemente todo el lote antes del HTTP 200.
  if (mensajes.length) await prisma.metaMensaje.createMany({ data: mensajes, skipDuplicates: true });
}

async function reclamar() {
  return prisma.$transaction(async (tx) => {
    // Bloqueo corto de cola; no se mantiene durante las llamadas a IA/Meta.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(185012, 1)`;
    await tx.metaMensaje.updateMany({
      where: { estado: { in: ['PROCESANDO', 'ENVIANDO'] }, leaseHasta: { lt: new Date() } },
      data: { estado: 'ERROR', ultimoError: 'PROCESO_INTERRUMPIDO: revisar antes de reintentar', leaseHasta: null }
    });
    const activos = await tx.metaMensaje.findMany({
      where: { estado: { in: ['PROCESANDO', 'ENVIANDO'] } }, select: { conversacion: true }
    });
    const siguiente = await tx.metaMensaje.findFirst({
      where: { estado: { in: ['PENDIENTE', 'RESPUESTA_LISTA'] }, conversacion: { notIn: activos.map(x => x.conversacion) } },
      orderBy: [{ fechaCreacion: 'asc' }, { id: 'asc' }]
    });
    if (!siguiente) return null;
    const estado = siguiente.estado === 'PENDIENTE' ? 'PROCESANDO' : 'ENVIANDO';
    return tx.metaMensaje.update({
      where: { id: siguiente.id },
      data: { estado, leaseHasta: new Date(Date.now() + 240000) }
    });
  }, { timeout: 10000 });
}

function actualizar(id, data) {
  return prisma.metaMensaje.update({ where: { id }, data });
}

module.exports = { guardar, reclamar, actualizar };
