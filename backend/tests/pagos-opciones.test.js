const { test } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/shared/prisma');
const Canal = require('../src/services/CanalesService');
const Cobros = require('../src/services/CobrosService');
const Calendario = require('../src/services/CalendarioService');
const Bloqueos = require('../src/repositories/BloqueosRepository');
const Citas = require('../src/repositories/CitasRepository');
const Pagos = require('../src/repositories/PagosRepository');
const Servicio = require('../src/services/PagosService');

test('opciones, efectivo confirmado sin pago y transferencia con plazo no prorrogable', async () => {
  const objetos = [[prisma, '$transaction'], [Canal, 'resolverCanalActivo'], [Cobros, 'mediosParaCanal'],
    [Calendario, 'sincronizarCitaConfirmada'], [Bloqueos, 'bloquearProfesional'],
    [Citas, 'buscarParaPago'], [Citas, 'actualizar'], [Pagos, 'buscarPendientePorCita'], [Pagos, 'actualizar']];
  const originales = objetos.map(([o, k]) => o[k]);
  const env = { ...process.env };
  let medios = [{ tipo: 'TRANSFERENCIA', entidad: { nombre: 'Banco prueba' }, numero: '001' }];
  let calendario = 0;
  let cita = { id: 1, estado: 'PENDIENTE_PAGO', precio: 100,
    fechaInicio: new Date(Date.now() + 3 * 86400000), fechaExpiracionReserva: new Date(Date.now() + 900000) };
  let pago = { id: 2, citaId: 1, estado: 'PENDIENTE', metodo: 'PASARELA', proveedor: 'SIMULADOR',
    montoEsperado: 30, montoRecibido: null, fechaExpiracion: cita.fechaExpiracionReserva, urlPago: null };
  const tx = { cita: { updateMany: async () => ({ count: 0 }) }, pago: { updateMany: async () => ({ count: 0 }) } };
  try {
    process.env.NODE_ENV = 'development'; process.env.PAGO_SIMULADOR_SECRETO = 'simulador-prueba';
    delete process.env.PAYPHONE_TOKEN; delete process.env.PAYPHONE_STORE_ID;
    prisma.$transaction = async fn => fn(tx);
    Canal.resolverCanalActivo = async () => ({ identificador: 'canal-test', profesionalId: 4,
      organizacionId: 7, organizacion: { direccion: 'Consultorio de prueba' } });
    Cobros.mediosParaCanal = async () => medios;
    Bloqueos.bloquearProfesional = async () => {};
    Calendario.sincronizarCitaConfirmada = async () => { calendario++; };
    Citas.buscarParaPago = async () => cita;
    Citas.actualizar = async (_id, data) => { cita = { ...cita, ...data }; return cita; };
    Pagos.buscarPendientePorCita = async () => pago;
    Pagos.actualizar = async (_id, data) => { pago = { ...pago, ...data }; return pago; };
    const opciones = await Servicio.consultarOpcionesPago('canal-test');
    assert.equal(opciones.efectivo.disponible, true);
    assert.equal(opciones.transferencia.disponible, true);
    assert.deepEqual(opciones.pasarela, { disponible: true, proveedor: 'SIMULADOR' });
    const efectivo = await Servicio.solicitarPago({ canalId: 'canal-test', citaId: 1, metodo: 'EFECTIVO' });
    assert.equal(efectivo.cita.estado, 'CONFIRMADA');
    assert.equal(efectivo.cita.fechaExpiracionReserva, null);
    assert.equal(efectivo.pago.estado, 'PENDIENTE');
    assert.equal(efectivo.pago.montoRecibido, null);
    assert.equal(Number(efectivo.pago.montoEsperado), 100);
    assert.equal(efectivo.pago.fechaExpiracion, null);
    assert.equal(calendario, 1);
    await Servicio.solicitarPago({ canalId: 'canal-test', citaId: 1, metodo: 'EFECTIVO' });
    assert.equal(calendario, 1);
    cita = { ...cita, estado: 'PENDIENTE_PAGO', fechaInicio: new Date(Date.now() + 5 * 3600000),
      fechaExpiracionReserva: new Date(Date.now() + 900000) };
    pago = { ...pago, metodo: 'PASARELA', proveedor: 'SIMULADOR', montoEsperado: 30,
      fechaExpiracion: cita.fechaExpiracionReserva, urlPago: null };
    const transferencia = await Servicio.solicitarPago({ canalId: 'canal-test', citaId: 1, metodo: 'TRANSFERENCIA' });
    assert.equal(transferencia.cita.estado, 'PENDIENTE_PAGO');
    assert.equal(transferencia.pago.metodo, 'TRANSFERENCIA');
    assert.equal(transferencia.mediosCobro.length, 1);
    assert.ok(transferencia.pago.fechaExpiracion <= cita.fechaInicio);
    assert.ok(transferencia.pago.fechaExpiracion.getTime() <= Date.now() + 86400000);
    const plazo = transferencia.pago.fechaExpiracion.getTime();
    await Servicio.solicitarPago({ canalId: 'canal-test', citaId: 1, metodo: 'TRANSFERENCIA' });
    assert.equal(pago.fechaExpiracion.getTime(), plazo);
    const reportado = await Servicio.reportarPagoManual({ canalId: 'canal-test', citaId: 1 });
    assert.equal(reportado.estado, 'COMPROBANTE_RECIBIDO');
    assert.ok(reportado.fechaExpiracion <= cita.fechaInicio);
    assert.equal(cita.estado, 'PENDIENTE_PAGO');
    const revisionHasta = reportado.fechaExpiracion.getTime();
    await Servicio.reportarPagoManual({ canalId: 'canal-test', citaId: 1 });
    assert.equal(pago.fechaExpiracion.getTime(), revisionHasta);
    pago = { ...pago, estado: 'PENDIENTE' };
    medios = [];
    await assert.rejects(Servicio.solicitarPago({ canalId: 'canal-test', citaId: 1, metodo: 'TRANSFERENCIA' }));
    assert.equal(cita.estado, 'PENDIENTE_PAGO');
    assert.equal(pago.metodo, 'TRANSFERENCIA');
    pago = { ...pago, metodo: 'PASARELA', proveedor: 'PAYPHONE', urlPago: 'https://pay.example/active' };
    await assert.rejects(Servicio.solicitarPago({ canalId: 'canal-test', citaId: 1, metodo: 'EFECTIVO' }), /enlace de pago activo/);
  } finally {
    objetos.forEach(([o, k], i) => { o[k] = originales[i]; });
    for (const key of ['NODE_ENV', 'PAGO_SIMULADOR_SECRETO', 'PAYPHONE_TOKEN', 'PAYPHONE_STORE_ID']) {
      if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key];
    }
  }
});
