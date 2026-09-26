require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('======================================');
  console.log('INICIANDO SEED DE AGENDA IA');
  console.log('======================================');

  // =====================================================
  // 1. ORGANIZACIÓN
  // =====================================================

  const organizacion = await prisma.organizacion.upsert({
    where: {
      codigo: 'agenda-demo'
    },

    update: {
      nombre: 'Agenda IA Demo',
      nombreComercial: 'Agenda IA Demo',
      activo: true
    },

    create: {
      codigo: 'agenda-demo',

      nombre: 'Agenda IA Demo',
      nombreComercial: 'Agenda IA Demo',

      telefono: '0999999999',
      email: 'demo@agendaia.local',

      zonaHoraria: 'America/Guayaquil',

      activo: true
    }
  });

  console.log(
    `Organización: ${organizacion.nombre} (ID ${organizacion.id})`
  );


  // =====================================================
  // 2. PROFESIONAL
  // =====================================================

  const profesional = await prisma.profesional.upsert({
    where: {
      organizacionId_codigo: {
        organizacionId: organizacion.id,
        codigo: 'prof-demo'
      }
    },

    update: {
      nombre: 'Carlos',
      apellido: 'Pérez',

      tipoProfesional: 'Profesional independiente',

      intervaloAgendaMinutos: 30,

      activo: true
    },

    create: {
      organizacionId: organizacion.id,

      codigo: 'prof-demo',

      nombre: 'Carlos',
      apellido: 'Pérez',

      telefono: '0998888888',
      email: 'carlos@agendaia.local',

      tipoProfesional: 'Profesional independiente',

      descripcion:
        'Profesional de demostración para pruebas del sistema.',

      zonaHoraria: 'America/Guayaquil',

      intervaloAgendaMinutos: 30,

      activo: true
    }
  });

  console.log(
    `Profesional: ${profesional.nombre} ${profesional.apellido}`
  );


  // =====================================================
  // 3. SERVICIOS
  // =====================================================

  const serviciosIniciales = [
    {
      codigo: 'consulta-general',
      nombre: 'Consulta general',
      descripcion: 'Consulta general con el profesional.',
      precio: 20,
      duracionMinutos: 30
    },

    {
      codigo: 'control-presion',
      nombre: 'Control de presion',
      descripcion: 'Control de presión.',
      precio: 10,
      duracionMinutos: 15
    },

    {
      codigo: 'inyeccion',
      nombre: 'Inyeccion / aplicacion de medicamento',
      descripcion: 'Aplicación de medicamento.',
      precio: 8,
      duracionMinutos: 15
    },

    {
      codigo: 'curacion-heridas',
      nombre: 'Curacion de heridas',
      descripcion: 'Curación de heridas.',
      precio: 15,
      duracionMinutos: 20
    },

    {
      codigo: 'certificado-medico',
      nombre: 'Certificado medico',
      descripcion: 'Emisión de certificado.',
      precio: 12,
      duracionMinutos: 15
    },

    {
      codigo: 'signos-vitales',
      nombre: 'Toma de signos vitales',
      descripcion: 'Toma de signos vitales.',
      precio: 5,
      duracionMinutos: 10
    }
  ];


  for (const datos of serviciosIniciales) {

    const servicio = await prisma.servicio.upsert({
      where: {
        organizacionId_codigo: {
          organizacionId: organizacion.id,
          codigo: datos.codigo
        }
      },

      update: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,

        precio: datos.precio,

        duracionMinutos:
          datos.duracionMinutos,

        requierePagoPrevio: true,

        porcentajeAnticipo: 100,

        activo: true
      },

      create: {
        organizacionId: organizacion.id,

        codigo: datos.codigo,

        nombre: datos.nombre,
        descripcion: datos.descripcion,

        precio: datos.precio,

        duracionMinutos:
          datos.duracionMinutos,

        requierePagoPrevio: true,

        porcentajeAnticipo: 100,

        activo: true
      }
    });


    // ===================================================
    // Relacionar servicio con profesional
    // ===================================================

    await prisma.profesionalServicio.upsert({
      where: {
        profesionalId_servicioId: {
          profesionalId: profesional.id,
          servicioId: servicio.id
        }
      },

      update: {
        activo: true
      },

      create: {
        profesionalId: profesional.id,
        servicioId: servicio.id,

        activo: true
      }
    });

    console.log(
      `Servicio: ${servicio.nombre} - $${servicio.precio}`
    );
  }


  // =====================================================
  // 4. HORARIOS DEL PROFESIONAL
  // =====================================================

  // Como es un seed de prueba, primero limpiamos
  // solamente los horarios de este profesional.

  await prisma.horarioProfesional.deleteMany({
    where: {
      profesionalId: profesional.id
    }
  });


  const horaInicio = new Date(
    '1970-01-01T08:00:00.000Z'
  );

  const horaFin = new Date(
    '1970-01-01T17:00:00.000Z'
  );


  await prisma.horarioProfesional.createMany({
    data: [
      {
        profesionalId: profesional.id,
        diaSemana: 'LUNES',
        horaInicio,
        horaFin,
        activo: true
      },

      {
        profesionalId: profesional.id,
        diaSemana: 'MARTES',
        horaInicio,
        horaFin,
        activo: true
      },

      {
        profesionalId: profesional.id,
        diaSemana: 'MIERCOLES',
        horaInicio,
        horaFin,
        activo: true
      },

      {
        profesionalId: profesional.id,
        diaSemana: 'JUEVES',
        horaInicio,
        horaFin,
        activo: true
      }
    ]
  });


  console.log(
    'Horario: lunes a jueves de 08:00 a 17:00'
  );


  console.log('======================================');
  console.log('SEED COMPLETADO CORRECTAMENTE');
  console.log('======================================');
}


main()
  .catch((error) => {

    console.error(
      'ERROR EJECUTANDO EL SEED'
    );

    console.error(error);

    process.exit(1);

  })
  .finally(async () => {

    await prisma.$disconnect();

  });