// Ejecutar explícitamente con META_TEST_DB=true, sobre la base local de desarrollo.
require('dotenv').config({ quiet: true });
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const prisma = require('../src/shared/prisma');
const Cola = require('../src/repositories/MetaMensajesRepository');

test('cola PostgreSQL: reentrega idempotente, exclusión por conversación y respuesta persistida',
  { skip: process.env.META_TEST_DB !== 'true' }, async () => {
    const prefijo = `test-meta-${crypto.randomUUID()}`;
    const base = { numeroId: '000000', canalId: 'prueba-no-rutear', remitente: '593999999999',
      conversacion: prefijo, tipo: 'text', texto: 'prueba', fechaCreacion: new Date('2000-01-01') };
    const primero = { ...base, id: `${prefijo}-1` };
    try {
      await Cola.guardar([primero]);
      await Cola.guardar([primero]);
      assert.equal(await prisma.metaMensaje.count({ where: { id: primero.id } }), 1);
      assert.equal((await Cola.reclamar()).id, primero.id);
      await Cola.guardar([{ ...base, id: `${prefijo}-2`, fechaCreacion: new Date('2000-01-02') }]);
      // El segundo permanece pendiente mientras el primero procesa la IA.
      const otro = await Cola.reclamar();
      assert.notEqual(otro?.id, `${prefijo}-2`);
      await Cola.actualizar(primero.id, { estado: 'RESPUESTA_LISTA', respuesta: 'Respuesta guardada', leaseHasta: null });
      const enviar = await Cola.reclamar();
      assert.equal(enviar.id, primero.id);
      assert.equal(enviar.estado, 'ENVIANDO');
      assert.equal(enviar.respuesta, 'Respuesta guardada');
      await Cola.actualizar(primero.id, { estado: 'ENVIADO', leaseHasta: null });
      assert.equal((await Cola.reclamar()).id, `${prefijo}-2`);
      await Cola.actualizar(`${prefijo}-2`, { leaseHasta: new Date('2000-01-01') });
      await Cola.reclamar();
      const interrumpido = await prisma.metaMensaje.findUnique({ where: { id: `${prefijo}-2` } });
      assert.equal(interrumpido.estado, 'ERROR'); // No se repite una reserva tras un timeout ambiguo.
    } finally {
      await prisma.metaMensaje.deleteMany({ where: { id: { startsWith: prefijo } } });
      await prisma.$disconnect();
    }
  });
