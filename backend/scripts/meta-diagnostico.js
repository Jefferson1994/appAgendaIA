require('dotenv').config({ quiet: true });
const prisma = require('../src/shared/prisma');
const { obtenerConfig } = require('../src/services/meta/MetaConfig');
const Canales = require('../src/services/CanalesService');

async function diagnosticar() {
  let correcto = true;
  for (const nombre of ['META_WHATSAPP_ACCESS_TOKEN', 'META_WHATSAPP_APP_SECRET', 'META_WHATSAPP_VERIFY_TOKEN']) {
    const presente = Boolean(process.env[nombre]);
    console.log(`${presente ? 'OK' : 'FALTA'} ${nombre}`);
    if (!presente) correcto = false;
  }
  const config = obtenerConfig();
  console.log(`Receptor Meta: ${config.habilitado ? 'habilitado' : 'deshabilitado en .env'}`);
  if (!Object.keys(config.canales).length) { console.log('FALTA configurar CHANNEL_MAP'); correcto = false; }
  for (const [numeroId, canalId] of Object.entries(config.canales)) {
    try {
      const canal = await Canales.resolverCanalActivo(canalId);
      console.log(`OK número Meta ${numeroId} -> ${canalId} (profesional ${canal.profesional.nombre} ${canal.profesional.apellido})`);
    } catch { console.log(`ERROR canal ${canalId}: no existe o no está activo`); correcto = false; }
  }
  try { await prisma.metaMensaje.count(); console.log('OK tabla meta_mensajes disponible'); }
  catch { console.log('ERROR base de datos o migración Meta pendiente'); correcto = false; }
  try {
    const estado = await fetch(new URL('/healthz', config.n8nUrl), { signal: AbortSignal.timeout(5000) });
    if (!estado.ok) throw new Error();
    console.log('OK n8n disponible');
  } catch { console.log('ERROR n8n no está disponible'); correcto = false; }
  console.log('Este diagnóstico no envía mensajes ni muestra credenciales.');
  if (!correcto) process.exitCode = 1;
}

diagnosticar().catch(() => {
  console.error('ERROR de configuración Meta; revisa .env y META-WHATSAPP.md.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
