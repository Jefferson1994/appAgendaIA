// =====================================================
// SEED MULTI-PROFESIONAL / MULTI-TENANT
// Agenda IA
// =====================================================

// Node 24 puede cargar directamente el archivo .env
process.loadEnvFile();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


// =====================================================
// DATOS DE PRUEBA
// =====================================================

const CANAL_CARLOS = 'wa-carlos-demo';
const CANAL_ANA = 'wa-ana-demo';


// =====================================================
// MAIN
// =====================================================

async function main() {

  console.log('');
  console.log('==============================================');
  console.log(' SEED MULTI-PROFESIONAL - AGENDA IA');
  console.log('==============================================');
  console.log('');


  // ===================================================
  // 1. BUSCAR PROFESIONAL EXISTENTE: CARLOS
  // ===================================================

  console.log('1. Buscando profesional de demostración existente...');

  const carlos = await prisma.profesional.findFirst({
    where: {
      codigo: 'prof-demo',
      activo: true
    },
    include: {
      organizacion: true
    }
  });


  if (!carlos) {
    throw new Error(
      'No se encontró el profesional con codigo "prof-demo". ' +
      'Ejecuta primero el seed principal prisma/seed.js.'
    );
  }


  console.log(
    `   ✓ Profesional encontrado: ${carlos.nombre} ${carlos.apellido || ''}`
  );

  console.log(
    `   ✓ Organización: ${carlos.organizacion.nombre}`
  );


  // ===================================================
  // 2. CREAR CANAL DE CARLOS
  // ===================================================

  console.log('');
  console.log('2. Creando canal de atención para Carlos...');


  const canalCarlos = await prisma.canalAtencion.upsert({

    where: {
      identificador: CANAL_CARLOS
    },

    update: {
      organizacionId: carlos.organizacionId,
      profesionalId: carlos.id,

      tipo: 'WHATSAPP',

      numeroDestino: '0991111111',

      activo: true
    },

    create: {
      organizacionId: carlos.organizacionId,
      profesionalId: carlos.id,

      tipo: 'WHATSAPP',

      identificador: CANAL_CARLOS,

      numeroDestino: '0991111111',

      activo: true
    }

  });


  console.log(
    `   ✓ ${canalCarlos.identificador} → ${carlos.nombre} ${carlos.apellido || ''}`
  );


  // ===================================================
  // 3. ORGANIZACIÓN DE ANA
  // ===================================================

  console.log('');
  console.log('3. Creando organización para Ana...');


  const organizacionAna = await prisma.organizacion.upsert({

    where: {
      codigo: 'odontologia-demo'
    },

    update: {
      nombre: 'Odontología Ana Demo',

      nombreComercial: 'Odontología Ana',

      telefono: '0992222222',

      email: 'ana@agendaia.local',

      zonaHoraria: 'America/Guayaquil',

      activo: true
    },

    create: {
      codigo: 'odontologia-demo',

      nombre: 'Odontología Ana Demo',

      nombreComercial: 'Odontología Ana',

      telefono: '0992222222',

      email: 'ana@agendaia.local',

      zonaHoraria: 'America/Guayaquil',

      activo: true
    }

  });


  console.log(
    `   ✓ Organización: ${organizacionAna.nombre}`
  );


  // ===================================================
  // 4. PROFESIONAL ANA LÓPEZ
  // ===================================================

  console.log('');
  console.log('4. Creando profesional Ana López...');


  const ana = await prisma.profesional.upsert({

    where: {
      organizacionId_codigo: {
        organizacionId: organizacionAna.id,
        codigo: 'odontologa-demo'
      }
    },

    update: {
      nombre: 'Ana',

      apellido: 'López',

      telefono: '0992222222',

      email: 'ana@agendaia.local',

      tipoProfesional: 'Odontóloga',

      descripcion:
        'Odontóloga de demostración para Agenda IA.',

      zonaHoraria: 'America/Guayaquil',

      intervaloAgendaMinutos: 30,

      activo: true
    },

    create: {
      organizacionId: organizacionAna.id,

      codigo: 'odontologa-demo',

      nombre: 'Ana',

      apellido: 'López',

      telefono: '0992222222',

      email: 'ana@agendaia.local',

      tipoProfesional: 'Odontóloga',

      descripcion:
        'Odontóloga de demostración para Agenda IA.',

      zonaHoraria: 'America/Guayaquil',

      intervaloAgendaMinutos: 30,

      activo: true
    }

  });


  console.log(
    `   ✓ Profesional: ${ana.nombre} ${ana.apellido}`
  );

  console.log(
    `   ✓ ID profesional: ${ana.id}`
  );


  // ===================================================
  // 5. CANAL DE WHATSAPP DE ANA
  // ===================================================

  console.log('');
  console.log('5. Creando canal de atención para Ana...');


  const canalAna = await prisma.canalAtencion.upsert({

    where: {
      identificador: CANAL_ANA
    },

    update: {
      organizacionId: organizacionAna.id,

      profesionalId: ana.id,

      tipo: 'WHATSAPP',

      numeroDestino: '0992222222',

      activo: true
    },

    create: {
      organizacionId: organizacionAna.id,

      profesionalId: ana.id,

      tipo: 'WHATSAPP',

      identificador: CANAL_ANA,

      numeroDestino: '0992222222',

      activo: true
    }

  });


  console.log(
    `   ✓ ${canalAna.identificador} → ${ana.nombre} ${ana.apellido}`
  );


  // ===================================================
  // 6. SERVICIOS DE ANA
  // ===================================================

  console.log('');
  console.log('6. Creando servicios de Ana...');


  const serviciosAna = [

    {
      codigo: 'limpieza-dental',

      nombre: 'Limpieza dental',

      descripcion:
        'Limpieza dental profesional.',

      precio: 30,

      duracionMinutos: 45
    },

    {
      codigo: 'blanqueamiento-dental',

      nombre: 'Blanqueamiento dental',

      descripcion:
        'Servicio de blanqueamiento dental.',

      precio: 60,

      duracionMinutos: 60
    },

    {
      codigo: 'evaluacion-odontologica',

      nombre: 'Evaluación odontológica',

      descripcion:
        'Evaluación odontológica general.',

      precio: 20,

      duracionMinutos: 30
    }

  ];


  for (const datos of serviciosAna) {

    // -------------------------------------------------
    // Servicio
    // -------------------------------------------------

    const servicio = await prisma.servicio.upsert({

      where: {
        organizacionId_codigo: {
          organizacionId: organizacionAna.id,
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
        organizacionId:
          organizacionAna.id,

        codigo:
          datos.codigo,

        nombre:
          datos.nombre,

        descripcion:
          datos.descripcion,

        precio:
          datos.precio,

        duracionMinutos:
          datos.duracionMinutos,

        requierePagoPrevio:
          true,

        porcentajeAnticipo:
          100,

        activo:
          true
      }

    });


    // -------------------------------------------------
    // Relación Profesional ↔ Servicio
    // -------------------------------------------------

    await prisma.profesionalServicio.upsert({

      where: {
        profesionalId_servicioId: {
          profesionalId: ana.id,
          servicioId: servicio.id
        }
      },

      update: {
        activo: true
      },

      create: {
        profesionalId: ana.id,

        servicioId: servicio.id,

        activo: true
      }

    });


    console.log(
      `   ✓ ${servicio.nombre} | $${servicio.precio} | ${servicio.duracionMinutos} min`
    );

  }


  // ===================================================
  // 7. HORARIOS DE ANA
  // ===================================================

  console.log('');
  console.log('7. Configurando horarios de Ana...');


  // Al ser datos de demostración,
  // limpiamos los horarios previos de Ana
  // antes de volver a generarlos.

  await prisma.horarioProfesional.deleteMany({

    where: {
      profesionalId: ana.id
    }

  });


  // PostgreSQL TIME se maneja mediante DateTime en Prisma.
  // Utilizamos 1970-01-01 únicamente como fecha técnica.
  // Solo nos interesa la parte de la hora.

  const horaInicio =
    new Date(
      '1970-01-01T09:00:00.000Z'
    );


  const horaFin =
    new Date(
      '1970-01-01T18:00:00.000Z'
    );


  await prisma.horarioProfesional.createMany({

    data: [

      {
        profesionalId: ana.id,

        diaSemana: 'LUNES',

        horaInicio,
        horaFin,

        activo: true
      },

      {
        profesionalId: ana.id,

        diaSemana: 'MARTES',

        horaInicio,
        horaFin,

        activo: true
      },

      {
        profesionalId: ana.id,

        diaSemana: 'MIERCOLES',

        horaInicio,
        horaFin,

        activo: true
      },

      {
        profesionalId: ana.id,

        diaSemana: 'JUEVES',

        horaInicio,
        horaFin,

        activo: true
      },

      {
        profesionalId: ana.id,

        diaSemana: 'VIERNES',

        horaInicio,
        horaFin,

        activo: true
      }

    ]

  });


  console.log(
    '   ✓ Lunes a viernes: 09:00 - 18:00'
  );

  console.log(
    '   ✓ Intervalo de agenda: 30 minutos'
  );


  // ===================================================
  // 8. RESUMEN
  // ===================================================

  console.log('');
  console.log('==============================================');
  console.log(' SEED MULTI-PROFESIONAL COMPLETADO');
  console.log('==============================================');

  console.log('');

  console.log('CARLOS');
  console.log(
    `  profesionalId: ${carlos.id}`
  );

  console.log(
    `  organizacionId: ${carlos.organizacionId}`
  );

  console.log(
    `  canal: ${CANAL_CARLOS}`
  );


  console.log('');

  console.log('ANA');
  console.log(
    `  profesionalId: ${ana.id}`
  );

  console.log(
    `  organizacionId: ${organizacionAna.id}`
  );

  console.log(
    `  canal: ${CANAL_ANA}`
  );


  console.log('');

  console.log(
    'Ahora tenemos dos profesionales independientes.'
  );

  console.log('');

}


// =====================================================
// EJECUCIÓN
// =====================================================

main()

  .catch((error) => {

    console.error('');
    console.error('==============================================');
    console.error(' ERROR EN SEED MULTI-PROFESIONAL');
    console.error('==============================================');

    console.error(error);

    process.exitCode = 1;

  })

  .finally(async () => {

    await prisma.$disconnect();

  });