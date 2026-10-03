
require('dotenv').config();

const app = require('./app');
const prisma = require('./shared/prisma');

// =====================================================
// ETAPA 4.3
// LIMPIEZA AUTOMATICA DE RESERVAS
// =====================================================

const {
  iniciarLimpiezaReservas
} = require('./jobs/expirar-reservas');

const PORT = process.env.PORT || 3000;


// =====================================================
// INICIAR SERVIDOR
// =====================================================

async function iniciarServidor() {

  try {

    // 1. Conectar con PostgreSQL
    await prisma.$connect();

    console.log(
      'Conexión a PostgreSQL establecida correctamente'
    );

    // 2. Iniciar Express
    app.listen(PORT, () => {

      console.log(
        `Backend Agenda IA escuchando en http://localhost:${PORT}`
      );

      // 3. Iniciar limpieza automática de reservas
      iniciarLimpiezaReservas();

    });

  } catch (error) {

    console.error(
      'No fue posible conectar con PostgreSQL:',
      error
    );

    process.exit(1);

  }

}


// =====================================================
// CERRAR APLICACION
// =====================================================

async function cerrarAplicacion() {

  console.log(
    'Cerrando Backend Agenda IA...'
  );

  try {

    await prisma.$disconnect();

    console.log(
      'Conexión PostgreSQL cerrada correctamente'
    );

    process.exit(0);

  } catch (error) {

    console.error(
      'Error cerrando PostgreSQL:',
      error
    );

    process.exit(1);

  }

}


// =====================================================
// EVENTOS DE CIERRE
// =====================================================

process.on('SIGINT', cerrarAplicacion);
process.on('SIGTERM', cerrarAplicacion);


// =====================================================
// EJECUTAR SERVIDOR
// =====================================================

iniciarServidor();
