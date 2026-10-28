const { test } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/shared/prisma');
const Canales = require('../src/services/CanalesService');
const Documentos = require('../src/services/DocumentosService');
const Pagos = require('../src/services/PagosService');
const Cliente = require('../src/services/meta/MetaCliente');
const Comprobantes = require('../src/services/meta/MetaComprobantes');

test('un adjunto solo se asocia a una transferencia inequívoca del mismo profesional y remitente', async () => {
  const originales = [Canales.resolverCanalActivo, prisma.pago.findMany, Documentos.subir,
    prisma.comprobantePago.create, Pagos.reportarPagoManual, Cliente.descargarMedio];
  let pendientes = [];
  let descargado = false;
  let reportado = false;
  try {
    Canales.resolverCanalActivo = async () => ({ organizacionId: 7, profesionalId: 4 });
    prisma.pago.findMany = async ({ where }) => {
      assert.equal(where.organizacionId, 7);
      assert.equal(where.cita.profesionalId, 4);
      assert.equal(where.metodo, 'TRANSFERENCIA');
      assert.ok(where.cita.cliente.telefono.in.includes('0999999999'));
      return pendientes;
    };
    Cliente.descargarMedio = async () => { descargado = true; return { contenido: Buffer.from('archivo') }; };
    Documentos.subir = async (actor, datos) => {
      assert.equal(actor.organizacionId, 7);
      assert.equal(datos.tipoCodigo, 'COMPROBANTE_PAGO');
      return { id: 90 };
    };
    prisma.comprobantePago.create = async ({ data }) => {
      assert.equal(data.pagoId, 57);
      assert.equal(data.documentoId, 90);
      assert.equal(data.archivoUrl, '/documentos/90/archivo');
    };
    Pagos.reportarPagoManual = async ({ citaId }) => { assert.equal(citaId, 78); reportado = true; };
    const mensaje = { canalId: 'wa-fredy-demo', remitente: '593999999999', medio: { id: '123' } };
    assert.match(await Comprobantes.recibir({}, mensaje), /No encontré/);
    assert.equal(descargado, false);
    pendientes = [{ id: 57, citaId: 78 }, { id: 58, citaId: 79 }];
    assert.match(await Comprobantes.recibir({}, mensaje), /varias/);
    assert.equal(descargado, false);
    pendientes = [{ id: 57, citaId: 78 }];
    assert.match(await Comprobantes.recibir({}, mensaje), /pendiente de validación/);
    assert.equal(descargado, true);
    assert.equal(reportado, true);
  } finally {
    [Canales.resolverCanalActivo, prisma.pago.findMany, Documentos.subir,
      prisma.comprobantePago.create, Pagos.reportarPagoManual, Cliente.descargarMedio] = originales;
  }
});
