require('dotenv').config();

const prisma = require('../src/shared/prisma');
const { ALCANCE_ROL, TIPO_ACCESO, AUTH } = require('../src/config/constantes');
const { PERMISOS } = require('../src/config/permisos');
const { hashear } = require('../src/security/passwords');
const PersonasRepository = require('../src/repositories/PersonasRepository');
const PermisosRepository = require('../src/repositories/PermisosRepository');
const RolesRepository = require('../src/repositories/RolesRepository');
const UsuariosRepository = require('../src/repositories/UsuariosRepository');
const ModulosRepository = require('../src/repositories/ModulosRepository');
const PantallasRepository = require('../src/repositories/PantallasRepository');
const OrganizacionModulosRepository = require('../src/repositories/OrganizacionModulosRepository');
// =====================================================
// DATOS INICIALES (despues de cargarlos, manda la base)
// =====================================================

const CATALOGO_PERMISOS = [
  { codigo: PERMISOS.CITAS_VER, categoria: 'citas', descripcion: 'Ver las citas' },
  { codigo: PERMISOS.CITAS_GESTIONAR, categoria: 'citas', descripcion: 'Crear, cancelar y modificar citas' },
  { codigo: PERMISOS.CLIENTES_VER, categoria: 'clientes', descripcion: 'Ver los clientes' },
  { codigo: PERMISOS.SERVICIOS_VER, categoria: 'servicios', descripcion: 'Ver los servicios' },
  { codigo: PERMISOS.SERVICIOS_GESTIONAR, categoria: 'servicios', descripcion: 'Crear y editar servicios' },
  { codigo: PERMISOS.PROFESIONALES_VER, categoria: 'profesionales', descripcion: 'Ver profesionales y recursos' },
  { codigo: PERMISOS.PROFESIONALES_GESTIONAR, categoria: 'profesionales', descripcion: 'Crear y editar profesionales y recursos' },
  { codigo: PERMISOS.PAGOS_VER, categoria: 'pagos', descripcion: 'Ver los pagos' },
  { codigo: PERMISOS.USUARIOS_GESTIONAR, categoria: 'usuarios', descripcion: 'Crear y administrar cuentas de la organizacion' },
  { codigo: PERMISOS.ROLES_GESTIONAR, categoria: 'roles', descripcion: 'Crear y editar roles de la organizacion' }
];

// Roles base que ve cualquier organizacion. Un administrador de empresa no necesita rol:
// tiene todos los permisos de su organizacion.
const ROLES_PLANTILLA = [
  {
    codigo: 'RECEPCION',
    nombre: 'Recepción',
    descripcion: 'Gestiona las citas de toda la organización',
    alcance: ALCANCE_ROL.ORGANIZACION,
    permisos: [
      PERMISOS.CITAS_VER,
      PERMISOS.CITAS_GESTIONAR,
      PERMISOS.CLIENTES_VER,
      PERMISOS.SERVICIOS_VER,
      PERMISOS.PROFESIONALES_VER
    ]
  },
  {
    codigo: 'PROFESIONAL',
    nombre: 'Profesional',
    descripcion: 'Ve y gestiona solo sus propias citas',
    alcance: ALCANCE_ROL.PROPIO,
    permisos: [
      PERMISOS.CITAS_VER,
      PERMISOS.CITAS_GESTIONAR,
      PERMISOS.CLIENTES_VER,
      PERMISOS.SERVICIOS_VER,
      PERMISOS.PAGOS_VER
    ]
  },
  {
    codigo: 'ADMIN_EMPRESA',
    nombre: 'Administrador de empresa',
    descripcion: 'Administra todo lo de su organización',
    alcance: ALCANCE_ROL.ORGANIZACION,
    permisos: CATALOGO_PERMISOS.map((permiso) => permiso.codigo)
  }
];

// Modulos de la plataforma. Las pantallas y sus botones se crean desde el front.
const MODULOS_INICIALES = [
  { codigo: 'INICIO', nombre: 'Inicio', icono: 'home', orden: 1, esBase: true },
  { codigo: 'AGENDA', nombre: 'Agenda', icono: 'calendar', orden: 2, esBase: false },
  { codigo: 'PACIENTES', nombre: 'Pacientes', icono: 'users', orden: 3, esBase: false },
  { codigo: 'CONSULTAS', nombre: 'Consultas', icono: 'clipboard', orden: 4, esBase: false },
  { codigo: 'MENSAJES', nombre: 'Mensajes', icono: 'message-circle', orden: 5, esBase: false },
  { codigo: 'HISTORIA_CLINICA', nombre: 'Historia clínica', icono: 'file-text', orden: 6, esBase: false },
  { codigo: 'FACTURACION', nombre: 'Facturación', icono: 'receipt', orden: 7, esBase: false },
  { codigo: 'PAGOS', nombre: 'Pagos', icono: 'credit-card', orden: 8, esBase: false },
  { codigo: 'REPORTES', nombre: 'Reportes', icono: 'bar-chart', orden: 9, esBase: false },
  { codigo: 'CONFIGURACION', nombre: 'Configuración', icono: 'settings', orden: 10, esBase: true }
];

// Una pantalla por modulo para arrancar. Los permisos listados son sus botones.
// Se pueden desactivar o reemplazar despues desde el front.
const PANTALLAS_INICIALES = [
  { modulo: 'INICIO', codigo: 'INICIO_RESUMEN', nombre: 'Inicio', ruta: '/inicio', icono: 'home', permisos: [] },
  {
    modulo: 'AGENDA',
    codigo: 'AGENDA_HOY',
    nombre: 'Agenda',
    ruta: '/agenda',
    icono: 'calendar',
    permisos: [PERMISOS.CITAS_VER, PERMISOS.CITAS_GESTIONAR]
  },
  {
    modulo: 'PACIENTES',
    codigo: 'PACIENTES_LISTA',
    nombre: 'Pacientes',
    ruta: '/pacientes',
    icono: 'users',
    permisos: [PERMISOS.CLIENTES_VER]
  },
  { modulo: 'CONSULTAS', codigo: 'CONSULTAS_LISTA', nombre: 'Consultas', ruta: '/consultas', icono: 'clipboard', permisos: [] },
  { modulo: 'MENSAJES', codigo: 'MENSAJES_BANDEJA', nombre: 'Mensajes', ruta: '/mensajes', icono: 'message-circle', permisos: [] },
  {
    modulo: 'HISTORIA_CLINICA',
    codigo: 'HISTORIA_CLINICA_LISTA',
    nombre: 'Historia clínica',
    ruta: '/historia-clinica',
    icono: 'file-text',
    permisos: []
  },
  { modulo: 'FACTURACION', codigo: 'FACTURACION_LISTA', nombre: 'Facturación', ruta: '/facturacion', icono: 'receipt', permisos: [] },
  {
    modulo: 'PAGOS',
    codigo: 'PAGOS_LISTA',
    nombre: 'Pagos',
    ruta: '/pagos',
    icono: 'credit-card',
    permisos: [PERMISOS.PAGOS_VER]
  },
  { modulo: 'REPORTES', codigo: 'REPORTES_GENERAL', nombre: 'Reportes', ruta: '/reportes', icono: 'bar-chart', permisos: [] },
  {
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_GENERAL',
    nombre: 'Configuración',
    ruta: '/configuracion',
    icono: 'settings',
    permisos: [PERMISOS.USUARIOS_GESTIONAR, PERMISOS.ROLES_GESTIONAR]
  }
];

// Pantallas que ve cada rol plantilla. El administrador de empresa no aparece
// porque ve todas las pantallas de los modulos que su empresa tiene licenciados.
const PANTALLAS_POR_ROL = {
  RECEPCION: ['INICIO_RESUMEN', 'AGENDA_HOY', 'PACIENTES_LISTA'],
  PROFESIONAL: ['INICIO_RESUMEN', 'AGENDA_HOY', 'PACIENTES_LISTA', 'PAGOS_LISTA']
};
// =====================================================
// CARGA
// =====================================================

async function cargarPermisos() {
  console.log('1. Catálogo de permisos');
  for (const permiso of CATALOGO_PERMISOS) {
    await PermisosRepository.crearOActualizar(permiso);
    console.log(`   ✓ ${permiso.codigo}`);
  }
}

async function cargarRolesPlantilla() {
  console.log('2. Roles plantilla');
  for (const plantilla of ROLES_PLANTILLA) {
    const existente = await RolesRepository.buscarPlantillaPorCodigo(plantilla.codigo);
    if (existente) {
      console.log(`   = ${plantilla.codigo} ya existía (no se modifica)`);
      continue;
    }

    const permisos = await PermisosRepository.buscarPorCodigos(plantilla.permisos);
    if (permisos.length !== plantilla.permisos.length) {
      throw new Error(`El rol ${plantilla.codigo} usa permisos que no están en el catálogo`);
    }

    await RolesRepository.crear({
      organizacionId: null,
      codigo: plantilla.codigo,
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      alcance: plantilla.alcance,
      esSistema: true,
      permisos: { create: permisos.map((permiso) => ({ permisoId: permiso.id })) }
    });
    console.log(`   ✓ ${plantilla.codigo} (${permisos.length} permisos)`);
  }
}

async function cargarModulos() {
  console.log('3. Módulos');
  for (const modulo of MODULOS_INICIALES) {
    const existente = await ModulosRepository.buscarPorCodigo(modulo.codigo);
    if (existente) {
      console.log(`   = ${modulo.codigo} ya existía (no se modifica)`);
      continue;
    }

    await ModulosRepository.crear(modulo);
    console.log(`   ✓ ${modulo.codigo}`);
  }
}

async function cargarPantallas() {
  console.log('4. Pantallas');
  for (const { modulo: codigoModulo, permisos, ...datos } of PANTALLAS_INICIALES) {
    const existente = await PantallasRepository.buscarPorCodigo(datos.codigo);
    if (existente) {
      console.log(`   = ${datos.codigo} ya existía (no se modifica)`);
      continue;
    }

    const modulo = await ModulosRepository.buscarPorCodigo(codigoModulo);
    if (!modulo) {
      throw new Error(`La pantalla ${datos.codigo} usa el módulo ${codigoModulo}, que no existe`);
    }

    const pantalla = await PantallasRepository.crear({ ...datos, moduloId: modulo.id });
    await PermisosRepository.asignarPantalla(permisos, pantalla.id);
    console.log(`   ✓ ${datos.codigo} (${permisos.length} botones)`);
  }
}

async function cargarPantallasDeRoles() {
  console.log('5. Pantallas de los roles plantilla');
  for (const [codigoRol, codigosPantalla] of Object.entries(PANTALLAS_POR_ROL)) {
    const rol = await RolesRepository.buscarPlantillaPorCodigo(codigoRol);
    if (!rol) {
      throw new Error(`El rol ${codigoRol} no existe`);
    }

    if ((await RolesRepository.contarPantallas(rol.id)) > 0) {
      console.log(`   = ${codigoRol} ya tenía pantallas (no se modifica)`);
      continue;
    }

    const pantallas = await Promise.all(
      codigosPantalla.map((codigo) => PantallasRepository.buscarPorCodigo(codigo))
    );
    if (pantallas.some((pantalla) => !pantalla)) {
      throw new Error(`El rol ${codigoRol} usa pantallas que no existen`);
    }

    await prisma.$transaction((tx) =>
      RolesRepository.reemplazarPantallas(rol.id, pantallas.map((pantalla) => pantalla.id), tx)
    );
    console.log(`   ✓ ${codigoRol} (${pantallas.length} pantallas)`);
  }
}

// Solo para desarrollo: licencia todos los modulos a todas las empresas.
// Se activa con SEED_LICENCIAR_TODO=true en el .env. En produccion no se usa.
async function licenciarTodoParaDesarrollo() {
  console.log('6. Licencias de desarrollo');

  if (process.env.SEED_LICENCIAR_TODO !== 'true') {
    console.log('   = omitido (define SEED_LICENCIAR_TODO=true en el .env para usarlo)');
    return;
  }

  const organizaciones = await prisma.organizacion.findMany({
    where: { activo: true },
    select: { id: true, codigo: true }
  });
  const modulos = (await ModulosRepository.listar()).filter((modulo) => !modulo.esBase);

  for (const organizacion of organizaciones) {
    for (const modulo of modulos) {
      await OrganizacionModulosRepository.guardar({
        organizacionId: organizacion.id,
        moduloId: modulo.id,
        activo: true,
        fechaInicio: new Date(),
        fechaFin: null
      });
    }
    console.log(`   ✓ ${organizacion.codigo} (${modulos.length} módulos)`);
  }
}

async function cargarSuperAdmin() {
  console.log('3. Super administrador');

  const email = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
  const clave = process.env.SUPERADMIN_PASSWORD || '';

  if (!email || clave.length < AUTH.CLAVE_MIN_LARGO) {
    throw new Error(
      `Define SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD (mínimo ${AUTH.CLAVE_MIN_LARGO} caracteres) en el .env`
    );
  }

  const existente = await UsuariosRepository.buscarPorEmail(email);
  if (existente) {
    console.log(`   = ${email} ya existía (no se modifica)`);
    return;
  }

    const passwordHash = await hashear(clave);

  await prisma.$transaction(async (tx) => {
    const persona = await PersonasRepository.crear(
      { nombres: 'Super', apellidos: 'Admin', email },
      tx
    );

    await UsuariosRepository.crear(
      {
        personaId: persona.id,
        email,
        passwordHash,
        tipoAcceso: TIPO_ACCESO.SUPER_ADMIN,
        activo: true
      },
      tx
    );
  });
  console.log(`   ✓ ${email}`);
}

async function main() {
  console.log('\n=== SEED DE ACCESO ===\n');
  await cargarPermisos();
  await cargarRolesPlantilla();
  await cargarModulos();
  await cargarPantallas();
  await cargarPantallasDeRoles();
  await licenciarTodoParaDesarrollo();
  await cargarSuperAdmin();
  console.log('\n=== SEED DE ACCESO COMPLETADO ===\n');
}

main()
  .catch((error) => {
    console.error('\nError en el seed de acceso:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());