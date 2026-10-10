// Borra TODAS las empresas y sus datos (usuarios, citas, pagos, profesionales, clientes...)
// y deja solo los catálogos de la plataforma: módulos, pantallas, permisos, acciones,
// roles plantilla, planes, categorías, cargos y el super admin.
//
// Solo para desarrollo. Sin --confirmar únicamente muestra cuánto se borraría.
//   node prisma/limpiar-datos-empresas.js              -> vista previa
//   node prisma/limpiar-datos-empresas.js --confirmar  -> borra
require('dotenv').config();

const prisma = require('../src/shared/prisma');
const { TIPO_ACCESO, TRANSACCION_OPCIONES } = require('../src/config/constantes');

const CONFIRMADO = process.argv.includes('--confirmar');

const NO_SUPER_ADMIN = { tipoAcceso: { not: TIPO_ACCESO.SUPER_ADMIN } };
const DE_EMPRESA = { organizacionId: { not: null } };
// Personas que no son el super admin (representantes, usuarios de empresas).
const PERSONA_SIN_SUPER_ADMIN = { NOT: { usuario: { tipoAcceso: TIPO_ACCESO.SUPER_ADMIN } } };

// En orden: primero lo que depende de otras tablas.
const PASOS = [
  ['Conciliaciones de pago', (db) => db.conciliacionPago, {}],
  ['Comprobantes de pago', (db) => db.comprobantePago, {}],
  ['Pagos', (db) => db.pago, {}],
  ['Transacciones bancarias', (db) => db.transaccionBancaria, {}],
  ['Citas', (db) => db.cita, {}],
  ['Canales de atención', (db) => db.canalAtencion, {}],
  ['Medios de cobro', (db) => db.medioCobro, {}],
  // Solo los metadatos: los archivos quedan en SeaweedFS (bórralos con su volumen si quieres).
  ['Documentos de empresas', (db) => db.documento, DE_EMPRESA],
  ['Excepciones de horario', (db) => db.excepcionHorario, {}],
  ['Horarios de profesionales', (db) => db.horarioProfesional, {}],
  ['Servicios por profesional', (db) => db.profesionalServicio, {}],
  ['Sesiones (refresh tokens) de empresas', (db) => db.refreshToken, { usuario: NO_SUPER_ADMIN }],
  ['Usuarios de empresas', (db) => db.usuario, NO_SUPER_ADMIN],
  ['Roles propios de empresas', (db) => db.rol, DE_EMPRESA],
  ['Servicios', (db) => db.servicio, {}],
  ['Profesionales', (db) => db.profesional, {}],
  ['Clientes', (db) => db.cliente, {}],
  ['Suscripciones', (db) => db.suscripcion, {}],
  ['Módulos sueltos de empresas', (db) => db.organizacionModulo, {}],
  ['Empresas', (db) => db.organizacion, {}],
  ['Personas (excepto el super admin)', (db) => db.persona, PERSONA_SIN_SUPER_ADMIN]
];

async function contar() {
  const conteos = [];
  for (const [nombre, tabla, where] of PASOS) {
    conteos.push({ tabla: nombre, registros: await tabla(prisma).count({ where }) });
  }
  return conteos;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Este script es solo para desarrollo: no se ejecuta con NODE_ENV=production');
  }

  console.log('\n=== LIMPIEZA DE DATOS DE EMPRESAS ===\n');
  console.table(await contar());

  if (!CONFIRMADO) {
    console.log('\nVista previa: no se borró nada.');
    console.log('Para borrar, ejecuta: node prisma/limpiar-datos-empresas.js --confirmar\n');
    return;
  }

  // Todo o nada: si una tabla falla, no queda la base a medio borrar.
  await prisma.$transaction(async (tx) => {
    for (const [nombre, tabla, where] of PASOS) {
      const { count } = await tabla(tx).deleteMany({ where });
      console.log(`   ✓ ${nombre}: ${count}`);
    }
  }, TRANSACCION_OPCIONES);

  console.log('\n=== LIMPIEZA COMPLETADA: quedan solo los catálogos y el super admin ===\n');
}

main()
  .catch((error) => {
    console.error('\nError en la limpieza (no se borró nada):', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
