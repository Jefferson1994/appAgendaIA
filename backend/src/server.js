require('dotenv').config();

const app = require('./app');
const prisma = require('./shared/prisma');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await prisma.$connect();

    console.log('Conexión a PostgreSQL establecida correctamente');

    app.listen(PORT, () => {
      console.log(
        `Backend Agenda IA escuchando en http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'No fue posible conectar con PostgreSQL:',
      error
    );

    process.exit(1);
  }
}

async function cerrarAplicacion() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', cerrarAplicacion);
process.on('SIGTERM', cerrarAplicacion);

iniciarServidor();