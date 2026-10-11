/**
 * Datos de prueba para la agenda de UNA empresa, sin levantar el bot (n8n).
 *
 *   node prisma/seed-demo-agenda.js <organizacionId>              crea los datos demo
 *   node prisma/seed-demo-agenda.js <organizacionId> --reiniciar  borra los demo anteriores y los vuelve a crear
 *
 * Qué hace:
 *  - Si la empresa no tiene horario, le pone uno (lunes a viernes 08:00–18:00, sábado 08:00–13:00).
 *  - Si un profesional o instalación no tiene horario propio, le pone uno distinto a cada uno
 *    (así se ve en la agenda que cada quien atiende en horas distintas).
 *  - Crea clientes (leads) demo y citas de los últimos 7 días y los próximos 7, en todos los
 *    estados, cada una con su profesional y un servicio que ese profesional ofrece.
 *
 * Solo toca a los clientes demo (teléfonos 09900001xx) y sus citas y pagos: --reiniciar no borra
 * nada más de la empresa.
 */
require('dotenv').config();
const crypto = require('crypto');
const { DateTime } = require('luxon');
const prisma = require('../src/shared/prisma');
const {
  DIAS_SEMANA,
  ESTADOS_CITA,
  ESTADOS_PAGO,
  PREFIJO_REFERENCIA_COBRO,
  PORCENTAJE_ANTICIPO_COMPLETO,
  MONEDA_DEFECTO,
  ZONA_HORARIA_DEFECTO
} = require('../src/config/constantes');
const { aHoraDb, horarioEfectivo, crearFechaHora } = require('../src/utils/horarios');

const PREFIJO_TELEFONO = '09900001';
const DIAS_ATRAS = 7;
const DIAS_ADELANTE = 7;
const CITAS_POR_DIA = { min: 2, max: 4 };

const CLIENTES_DEMO = [
  ['María', 'Vélez'], ['Carlos', 'Andrade'], ['Lucía', 'Paredes'], ['Andrés', 'Mora'],
  ['Gabriela', 'Torres'], ['Diego', 'Salazar'], ['Paola', 'Cedeño'], ['Jorge', 'Cevallos'],
  ['Valeria', 'Ríos'], ['Fernando', 'Ortiz'], ['Daniela', 'Mendoza'], ['Ricardo', 'Vera']
];

const LUNES_A_VIERNES = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
const HORARIO_EMPRESA = [
  ...LUNES_A_VIERNES.map((dia) => [dia, '08:00', '18:00']),
  ['SABADO', '08:00', '13:00']
];
// Uno distinto por cada profesional o instalación sin horario propio (se repiten en ciclo).
const HORARIOS_RECURSO = [
  LUNES_A_VIERNES.map((dia) => [dia, '08:00', '13:00']),
  [...LUNES_A_VIERNES.map((dia) => [dia, '14:00', '18:00']), ['SABADO', '08:00', '12:00']],
  LUNES_A_VIERNES.map((dia) => [dia, '09:00', '17:00'])
];

const aFranjas = (lista) => lista.map(([diaSemana, inicio, fin]) => ({ diaSemana, horaInicio: aHoraDb(inicio), horaFin: aHoraDb(fin) }));
const telefonoDemo = (indice) => `${PREFIJO_TELEFONO}${String(indice + 1).padStart(2, '0')}`;

// Aleatorio con semilla: los mismos datos cada vez que se corre.
function generador(semilla) {
  let estado = semilla;
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return estado / 2147483648;
  };
}

function elegirEstado(azar, esPasada, esHoy, pidePago) {
  const r = azar();
  if (esPasada) {
    if (r < 0.65) return ESTADOS_CITA.ATENDIDA;
    if (r < 0.8) return ESTADOS_CITA.NO_ASISTIO;
    return ESTADOS_CITA.CANCELADA;
  }
  if (esHoy && r < 0.2) return ESTADOS_CITA.ATENDIDA;
  if (pidePago && r < 0.45) return ESTADOS_CITA.PENDIENTE_PAGO;
  if (r < 0.9) return ESTADOS_CITA.CONFIRMADA;
  return ESTADOS_CITA.CANCELADA;
}

const porcentajeDe = (servicio) =>
  servicio.porcentajeAnticipo === null
    ? servicio.requierePagoPrevio ? PORCENTAJE_ANTICIPO_COMPLETO : 0
    : Number(servicio.porcentajeAnticipo);

async function borrarDemo(organizacionId) {
  const clientes = await prisma.cliente.findMany({
    where: { organizacionId, telefono: { startsWith: PREFIJO_TELEFONO } },
    select: { id: true }
  });
  const ids = clientes.map((cliente) => cliente.id);
  if (ids.length === 0) return;
  const citas = await prisma.cita.findMany({ where: { clienteId: { in: ids } }, select: { id: true } });
  const citaIds = citas.map((cita) => cita.id);
  const pagos = await prisma.pago.findMany({ where: { citaId: { in: citaIds } }, select: { id: true } });
  const pagoIds = pagos.map((pago) => pago.id);

  await prisma.$transaction([
    prisma.conciliacionPago.deleteMany({ where: { pagoId: { in: pagoIds } } }),
    prisma.comprobantePago.deleteMany({ where: { pagoId: { in: pagoIds } } }),
    prisma.pago.deleteMany({ where: { id: { in: pagoIds } } }),
    prisma.cita.deleteMany({ where: { id: { in: citaIds } } }),
    prisma.cliente.deleteMany({ where: { id: { in: ids } } })
  ]);
  console.log(`   ✓ Borrados ${ids.length} clientes demo, ${citaIds.length} citas y ${pagoIds.length} pagos`);
}

async function asegurarHorarios(organizacion, recursos) {
  const horarioEmpresa = await prisma.horarioOrganizacion.findMany({ where: { organizacionId: organizacion.id } });
  let empresa = horarioEmpresa;
  if (horarioEmpresa.length === 0) {
    await prisma.horarioOrganizacion.createMany({
      data: aFranjas(HORARIO_EMPRESA).map((franja) => ({ ...franja, organizacionId: organizacion.id }))
    });
    empresa = await prisma.horarioOrganizacion.findMany({ where: { organizacionId: organizacion.id } });
    console.log('   ✓ Horario de la empresa: lunes a viernes 08:00–18:00, sábado 08:00–13:00');
  } else {
    console.log('   · La empresa ya tenía horario: no se cambia');
  }

  let siguiente = 0;
  for (const recurso of recursos) {
    if (recurso.horarios.length > 0) {
      console.log(`   · ${recurso.nombre} ya tenía horario propio: no se cambia`);
      continue;
    }
    const plantilla = HORARIOS_RECURSO[siguiente % HORARIOS_RECURSO.length];
    siguiente += 1;
    await prisma.horarioProfesional.createMany({
      data: aFranjas(plantilla).map((franja) => ({ ...franja, profesionalId: recurso.id }))
    });
    recurso.horarios = await prisma.horarioProfesional.findMany({ where: { profesionalId: recurso.id, activo: true } });
    const resumen = [...new Set(plantilla.map(([, inicio, fin]) => `${inicio}–${fin}`))].join(', ');
    console.log(`   ✓ Horario de ${recurso.nombre}: ${resumen}`);
  }
  return empresa;
}

// Horas de inicio posibles de un día (en la rejilla del profesional) donde cabe el servicio
// sin pisar otra cita ya puesta.
function huecosDelDia(fecha, franjas, intervalo, duracion, ocupadas) {
  const huecos = [];
  for (const franja of franjas) {
    let cursor = crearFechaHora(fecha, franja.horaInicio);
    const fin = crearFechaHora(fecha, franja.horaFin);
    while (cursor.plus({ minutes: duracion }) <= fin) {
      const finCita = cursor.plus({ minutes: duracion });
      const libre = !ocupadas.some((cita) => cursor < cita.fin && finCita > cita.inicio);
      if (libre) huecos.push(cursor);
      cursor = cursor.plus({ minutes: intervalo });
    }
  }
  return huecos;
}

async function crearCitas(organizacion, recursos, empresa, clientes) {
  const zona = organizacion.zonaHoraria || ZONA_HORARIA_DEFECTO;
  const hoy = DateTime.now().setZone(zona).startOf('day');
  const azar = generador(organizacion.id * 7919);
  let total = 0;

  for (const [indice, recurso] of recursos.entries()) {
    const servicios = recurso.servicios.filter((asignacion) => asignacion.servicio.activo);
    if (servicios.length === 0) {
      console.log(`   · ${recurso.nombre} no ofrece servicios: sin citas`);
      continue;
    }
    // Cada profesional tiene sus propios clientes y comparte un par con los demás
    // (la misma persona puede atenderse con dos doctores).
    const propios = clientes.filter((_, i) => i % recursos.length === indice);
    const compartidos = clientes.slice(0, 2);
    const susClientes = [...new Set([...propios, ...compartidos])];

    const franjasDe = horarioEfectivo(recurso.horarios, empresa);
    let delRecurso = 0;

    for (let desplazamiento = -DIAS_ATRAS; desplazamiento <= DIAS_ADELANTE; desplazamiento += 1) {
      const fecha = hoy.plus({ days: desplazamiento });
      const franjas = franjasDe.filter((franja) => franja.diaSemana === DIAS_SEMANA[fecha.weekday]);
      if (franjas.length === 0) continue;

      const ocupadas = [];
      const cuantas = CITAS_POR_DIA.min + Math.floor(azar() * (CITAS_POR_DIA.max - CITAS_POR_DIA.min + 1));
      for (let n = 0; n < cuantas; n += 1) {
        const asignacion = servicios[Math.floor(azar() * servicios.length)];
        const servicio = asignacion.servicio;
        const duracion = asignacion.duracionPersonalizadaMinutos ?? servicio.duracionMinutos;
        const huecos = huecosDelDia(fecha, franjas, recurso.intervaloAgendaMinutos, duracion, ocupadas);
        if (huecos.length === 0) break;

        const inicio = huecos[Math.floor(azar() * huecos.length)];
        const fin = inicio.plus({ minutes: duracion });
        ocupadas.push({ inicio, fin });

        const porcentaje = porcentajeDe(servicio);
        const esPasada = fin < DateTime.now().setZone(zona);
        const estado = elegirEstado(azar, esPasada, desplazamiento === 0, porcentaje > 0);
        const precio = Number(asignacion.precioPersonalizado ?? servicio.precio);
        const cliente = susClientes[Math.floor(azar() * susClientes.length)];

        const cita = await prisma.cita.create({
          data: {
            organizacionId: organizacion.id,
            profesionalId: recurso.id,
            clienteId: cliente.id,
            servicioId: servicio.id,
            fechaInicio: inicio.toUTC().toJSDate(),
            fechaFin: fin.toUTC().toJSDate(),
            precio,
            duracionMinutos: duracion,
            estado,
            notasCliente: azar() < 0.25 ? 'Cita de prueba (datos demo)' : null
          }
        });

        // Cobro: pendiente si espera el pago; confirmado si ya se atendió o confirmó con pago previo.
        const conPago = porcentaje > 0 && [ESTADOS_CITA.PENDIENTE_PAGO, ESTADOS_CITA.CONFIRMADA, ESTADOS_CITA.ATENDIDA].includes(estado);
        if (conPago) {
          const pagado = estado !== ESTADOS_CITA.PENDIENTE_PAGO;
          const monto = Math.round(precio * porcentaje) / 100;
          await prisma.pago.create({
            data: {
              organizacionId: organizacion.id,
              citaId: cita.id,
              montoEsperado: monto,
              montoRecibido: pagado ? monto : null,
              metodo: 'TRANSFERENCIA',
              estado: pagado ? ESTADOS_PAGO.CONFIRMADO : ESTADOS_PAGO.PENDIENTE,
              referenciaCobro: `${PREFIJO_REFERENCIA_COBRO}${cita.id}-${crypto.randomUUID().replaceAll('-', '')}`,
              moneda: organizacion.moneda || MONEDA_DEFECTO,
              porcentajeAnticipoAplicado: porcentaje,
              fechaConfirmacion: pagado ? new Date() : null
            }
          });
        }
        delRecurso += 1;
      }
    }
    total += delRecurso;
    console.log(`   ✓ ${recurso.nombre}: ${delRecurso} citas con ${susClientes.length} clientes`);
  }
  return total;
}

async function main() {
  const organizacionId = Number(process.argv[2]);
  const reiniciar = process.argv.includes('--reiniciar');
  if (!Number.isInteger(organizacionId) || organizacionId <= 0) {
    console.log('Uso: node prisma/seed-demo-agenda.js <organizacionId> [--reiniciar]');
    process.exit(1);
  }

  const organizacion = await prisma.organizacion.findFirst({ where: { id: organizacionId, activo: true } });
  if (!organizacion) throw new Error(`No existe una empresa activa con id ${organizacionId}`);
  console.log(`\nDatos demo de agenda: ${organizacion.nombreComercial || organizacion.nombre} (id ${organizacion.id})`);

  const yaHay = await prisma.cliente.count({ where: { organizacionId, telefono: { startsWith: PREFIJO_TELEFONO } } });
  if (yaHay > 0 && !reiniciar) {
    console.log(`   · Ya hay ${yaHay} clientes demo. Usa --reiniciar para borrarlos y crearlos de nuevo.`);
    return;
  }
  if (reiniciar) await borrarDemo(organizacionId);

  const recursos = await prisma.profesional.findMany({
    where: { organizacionId, activo: true },
    include: {
      horarios: { where: { activo: true } },
      servicios: { where: { activo: true }, include: { servicio: true } }
    },
    orderBy: { id: 'asc' }
  });
  if (recursos.length === 0) throw new Error('La empresa no tiene profesionales ni instalaciones activos');

  const empresa = await asegurarHorarios(organizacion, recursos);

  const clientes = [];
  for (const [indice, [nombre, apellido]] of CLIENTES_DEMO.entries()) {
    clientes.push(
      await prisma.cliente.create({
        data: { organizacionId, nombre, apellido, telefono: telefonoDemo(indice), email: null, activo: true }
      })
    );
  }
  console.log(`   ✓ ${clientes.length} clientes (leads) demo`);

  const total = await crearCitas(organizacion, recursos, empresa, clientes);
  console.log(`\n✅ Listo: ${total} citas demo.\n`);
}

main()
  .catch((error) => {
    console.error('❌', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
