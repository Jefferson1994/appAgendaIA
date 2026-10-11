/**
 * Cierra las licencias de módulos sueltos que regaló el seed con SEED_LICENCIAR_TODO=true,
 * para que cada empresa quede solo con los módulos base y los de su plan.
 *
 *   node prisma/quitar-licencias-desarrollo.js                      muestra qué cerraría (no cambia nada)
 *   node prisma/quitar-licencias-desarrollo.js --confirmar          las cierra en todas las empresas
 *   node prisma/quitar-licencias-desarrollo.js 10 --confirmar       solo en la empresa 10
 *
 * No borra nada: marca la licencia inactiva con fecha de fin de hoy (queda en el historial).
 * Ojo: también cierra los módulos sueltos que una empresa haya comprado de verdad.
 */
require('dotenv').config();
const prisma = require('../src/shared/prisma');

async function main() {
  const confirmar = process.argv.includes('--confirmar');
  const organizacionId = Number(process.argv.find((arg) => /^\d+$/.test(arg))) || null;
  const ahora = new Date();

  const where = {
    activo: true,
    OR: [{ fechaFin: null }, { fechaFin: { gt: ahora } }],
    ...(organizacionId ? { organizacionId } : {})
  };
  const licencias = await prisma.organizacionModulo.findMany({
    where,
    include: { organizacion: { select: { nombre: true } }, modulo: { select: { nombre: true } } },
    orderBy: [{ organizacionId: 'asc' }, { moduloId: 'asc' }]
  });

  const porEmpresa = new Map();
  for (const licencia of licencias) {
    const nombre = licencia.organizacion.nombre;
    porEmpresa.set(nombre, [...(porEmpresa.get(nombre) || []), licencia.modulo.nombre]);
  }
  console.log(`\nLicencias sueltas vigentes: ${licencias.length}`);
  for (const [empresa, modulos] of porEmpresa) console.log(`   ${empresa}: ${modulos.join(', ')}`);

  if (!confirmar) {
    console.log('\nNo se cambió nada. Agrega --confirmar para cerrarlas.\n');
    return;
  }
  const { count } = await prisma.organizacionModulo.updateMany({ where, data: { activo: false, fechaFin: ahora } });
  console.log(`\n✅ ${count} licencias cerradas. Cada empresa queda con los módulos base y los de su plan.\n`);
}

main()
  .catch((error) => {
    console.error('❌', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
