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
const AccionesRepository = require('../src/repositories/AccionesRepository');
const PlanesRepository = require('../src/repositories/PlanesRepository');
const { TIPOS_RESERVA, CATALOGOS, TIPOS_DOCUMENTO } = require('../src/config/constantes');
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
  { codigo: PERMISOS.ROLES_GESTIONAR, categoria: 'roles', descripcion: 'Crear y editar roles de la organizacion' },
  {
    codigo: PERMISOS.MODULOS_GESTIONAR,
    categoria: 'plataforma',
    descripcion: 'Crear y editar módulos, pantallas y botones de la plataforma',
    soloPlataforma: true
  },
  {
    codigo: PERMISOS.PLANES_GESTIONAR,
    categoria: 'plataforma',
    descripcion: 'Crear planes de suscripción y fijar precios de módulos',
    soloPlataforma: true
  },
  {
    codigo: PERMISOS.CATEGORIAS_GESTIONAR,
    categoria: 'plataforma',
    descripcion: 'Crear categorías de negocio y los cargos de cada una',
    soloPlataforma: true
  },
  {
    codigo: PERMISOS.CATALOGOS_GESTIONAR,
    categoria: 'plataforma',
    descripcion: 'Administrar los valores de los catálogos (bancos, billeteras, tipos de cuenta...)',
    soloPlataforma: true
  },
  {
    codigo: PERMISOS.COBROS_GESTIONAR,
    categoria: 'cobros',
    descripcion: 'Administrar las cuentas de cobro de la empresa y si cada profesional cobra en las suyas'
  },
  {
    codigo: PERMISOS.SUSCRIPCION_GESTIONAR,
    categoria: 'suscripcion',
    descripcion: 'Cambiar el plan de la empresa y contratar módulos sueltos'
  }
];

// Permisos que puede tener una empresa: los de plataforma son solo del super admin.
const PERMISOS_DE_EMPRESA = CATALOGO_PERMISOS.filter((permiso) => !permiso.soloPlataforma).map(
  (permiso) => permiso.codigo
);

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
    permisos: PERMISOS_DE_EMPRESA
  }
];

// Catalogo de botones que se asignan a las pantallas desde Configuracion de modulos.
// requiereSeleccion = false: el boton funciona sin un registro seleccionado.
const CATALOGO_ACCIONES = [
  { codigo: 'VER', nombre: 'Ver detalle', icono: 'eye', orden: 1, requiereSeleccion: true },
  { codigo: 'CREAR', nombre: 'Nuevo', icono: 'plus', orden: 2, requiereSeleccion: false },
  { codigo: 'EDITAR', nombre: 'Editar', icono: 'pencil', orden: 3, requiereSeleccion: true },
  { codigo: 'ELIMINAR', nombre: 'Eliminar', icono: 'trash-2', orden: 4, requiereSeleccion: true },
  { codigo: 'CAMBIAR_ESTADO', nombre: 'Activar/Desactivar', icono: 'power', orden: 5, requiereSeleccion: true },
  { codigo: 'EXPORTAR', nombre: 'Exportar', icono: 'download', orden: 6, requiereSeleccion: false }
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
    // Super admin: roles plantilla para todas las empresas. Empresa: sus roles propios.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_ROLES',
    nombre: 'Roles y permisos',
    ruta: '/roles',
    icono: 'shield-check',
    orden: 4,
    permisos: [PERMISOS.ROLES_GESTIONAR]
  },
  {
    // El administrador de la empresa crea los usuarios y les asigna un rol.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_USUARIOS',
    nombre: 'Usuarios',
    ruta: '/usuarios',
    icono: 'users-round',
    orden: 5,
    permisos: [PERMISOS.USUARIOS_GESTIONAR]
  },
  {
    // Solo la ve el super admin: aquí se crean módulos, pantallas y botones.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_MODULOS',
    nombre: 'Configuración de módulos',
    ruta: '/configuracion-modulos',
    icono: 'layout-grid',
    orden: 1,
    soloPlataforma: true,
    permisos: [PERMISOS.MODULOS_GESTIONAR]
  },
  {
    // Solo la ve el super admin: planes de suscripción y precios de módulos.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_PLANES',
    nombre: 'Planes',
    ruta: '/planes',
    icono: 'package',
    orden: 2,
    soloPlataforma: true,
    permisos: [PERMISOS.PLANES_GESTIONAR]
  },
  {
    // Solo la ve el super admin: tipos de negocio (dos niveles) y los cargos de cada uno.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_CATEGORIAS',
    nombre: 'Categorías y cargos',
    ruta: '/categorias',
    icono: 'tags',
    orden: 6,
    soloPlataforma: true,
    permisos: [PERMISOS.CATEGORIAS_GESTIONAR]
  },
  {
    // Solo la ve el super admin: valores de los catálogos genéricos.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_CATALOGOS',
    nombre: 'Catálogos',
    ruta: '/catalogos',
    icono: 'list',
    orden: 7,
    soloPlataforma: true,
    permisos: [PERMISOS.CATALOGOS_GESTIONAR]
  },
  {
    // El administrador: cuentas de la empresa y si cada profesional cobra en las suyas.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_COBROS',
    nombre: 'Cobros',
    ruta: '/cobros',
    icono: 'wallet',
    orden: 8,
    permisos: [PERMISOS.COBROS_GESTIONAR]
  },
  {
    // Cada usuario edita sus datos, su correo y su clave; el profesional, sus cuentas.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_PERFIL',
    nombre: 'Mi perfil',
    ruta: '/mi-perfil',
    icono: 'user-round',
    orden: 0,
    paraTodos: true,
    permisos: []
  },
  {
    // El administrador de cada empresa elige su plan y compra módulos sueltos.
    modulo: 'CONFIGURACION',
    codigo: 'CONFIGURACION_SUSCRIPCION',
    nombre: 'Mi suscripción',
    ruta: '/mi-suscripcion',
    icono: 'credit-card',
    orden: 3,
    permisos: [PERMISOS.SUSCRIPCION_GESTIONAR]
  }
];

// Catálogos genéricos. El código del catálogo lo usa el backend; los valores se editan
// después desde la pantalla Catálogos. Solo se crea lo que no existe.
const CATALOGOS_INICIALES = [
  {
    codigo: CATALOGOS.BANCOS,
    nombre: 'Bancos y cooperativas',
    descripcion: 'Entidades para cobrar por transferencia',
    items: [
      'Banco Pichincha', 'Banco Guayaquil', 'Produbanco', 'Banco del Pacífico', 'Banco Bolivariano',
      'Banco Internacional', 'Banco del Austro', 'Banco de Machala', 'Banco General Rumiñahui', 'Banco de Loja',
      'Banco Solidario', 'Banco ProCredit', 'BanEcuador', 'Cooperativa JEP', 'Cooperativa Jardín Azuayo',
      'Cooperativa Policía Nacional', 'Cooperativa 29 de Octubre', 'Mutualista Pichincha'
    ]
  },
  {
    codigo: CATALOGOS.BILLETERAS,
    nombre: 'Billeteras digitales',
    descripcion: 'Apps para cobrar con QR o número de teléfono',
    items: ['Deuna', 'PayPhone']
  },
  {
    codigo: CATALOGOS.TIPOS_CUENTA,
    nombre: 'Tipos de cuenta',
    descripcion: 'Tipo de cuenta bancaria',
    items: [
      { codigo: 'AHORROS', nombre: 'Ahorros' },
      { codigo: 'CORRIENTE', nombre: 'Corriente' }
    ]
  },
  {
    codigo: CATALOGOS.TIPOS_DOCUMENTO,
    nombre: 'Tipos de documento',
    descripcion: 'Qué es cada archivo subido (el código lo usa el backend para validar el formato)',
    items: [
      { codigo: TIPOS_DOCUMENTO.QR_COBRO, nombre: 'QR de cobro' },
      { codigo: TIPOS_DOCUMENTO.COMPROBANTE_PAGO, nombre: 'Comprobante de pago' }
    ]
  }
];

// Tipos de negocio iniciales. Cada categoría general trae los cargos que comparten todas sus
// subcategorías; cada subcategoría, los suyos. `reserva` = qué reserva el cliente.
// Solo se crean los que no existen (por código); después se editan desde la pantalla.
const { PERSONAS, ESPACIOS, AMBOS } = TIPOS_RESERVA;
const CATEGORIAS_INICIALES = [
  {
    codigo: 'SALUD', nombre: 'Salud', icono: 'heart-pulse', reserva: PERSONAS, orden: 1,
    cargos: ['Recepcionista', 'Asistente', 'Administrador'],
    subcategorias: [
      { codigo: 'SALUD_ODONTOLOGIA', nombre: 'Odontología', icono: 'smile', cargos: ['Odontólogo', 'Ortodoncista', 'Asistente dental'] },
      { codigo: 'SALUD_MEDICINA_GENERAL', nombre: 'Medicina general', icono: 'stethoscope', cargos: ['Médico general', 'Enfermero'] },
      { codigo: 'SALUD_PSICOLOGIA', nombre: 'Psicología', icono: 'brain', cargos: ['Psicólogo'] },
      { codigo: 'SALUD_FISIOTERAPIA', nombre: 'Fisioterapia', icono: 'activity', cargos: ['Fisioterapeuta'] }
    ]
  },
  {
    codigo: 'BELLEZA', nombre: 'Belleza y cuidado', icono: 'scissors', reserva: PERSONAS, orden: 2,
    cargos: ['Recepcionista', 'Administrador'],
    subcategorias: [
      { codigo: 'BELLEZA_BARBERIA', nombre: 'Barbería', icono: 'scissors', cargos: ['Barbero'] },
      { codigo: 'BELLEZA_PELUQUERIA', nombre: 'Peluquería', icono: 'sparkles', cargos: ['Estilista', 'Colorista'] },
      { codigo: 'BELLEZA_SPA', nombre: 'Spa', icono: 'flower-2', cargos: ['Masajista', 'Esteticista'] },
      { codigo: 'BELLEZA_UNAS', nombre: 'Uñas', icono: 'hand', cargos: ['Manicurista'] }
    ]
  },
  {
    codigo: 'DEPORTES', nombre: 'Deportes', icono: 'trophy', reserva: ESPACIOS, orden: 3,
    cargos: ['Recepcionista', 'Administrador de instalaciones', 'Cajero'],
    subcategorias: [
      { codigo: 'DEPORTES_CANCHA_SINTETICA', nombre: 'Cancha sintética', icono: 'goal', cargos: [] },
      { codigo: 'DEPORTES_PADEL', nombre: 'Pádel', icono: 'circle-dot', cargos: [] },
      { codigo: 'DEPORTES_GIMNASIO', nombre: 'Gimnasio', icono: 'dumbbell', reserva: AMBOS, cargos: ['Entrenador'] }
    ]
  },
  {
    codigo: 'GASTRONOMIA', nombre: 'Gastronomía', icono: 'utensils', reserva: ESPACIOS, orden: 4,
    cargos: ['Recepcionista', 'Mesero', 'Cajero', 'Chef'],
    subcategorias: [
      { codigo: 'GASTRONOMIA_RESTAURANTE', nombre: 'Restaurante', icono: 'utensils', cargos: [] },
      { codigo: 'GASTRONOMIA_BAR', nombre: 'Bar', icono: 'wine', cargos: ['Bartender'] }
    ]
  },
  {
    codigo: 'MASCOTAS', nombre: 'Mascotas', icono: 'paw-print', reserva: PERSONAS, orden: 5,
    cargos: ['Recepcionista'],
    subcategorias: [
      { codigo: 'MASCOTAS_VETERINARIA', nombre: 'Veterinaria', icono: 'paw-print', cargos: ['Veterinario', 'Asistente veterinario'] },
      { codigo: 'MASCOTAS_PELUQUERIA', nombre: 'Peluquería de mascotas', icono: 'scissors', cargos: ['Groomer'] }
    ]
  },
  {
    codigo: 'SERVICIOS_PROFESIONALES', nombre: 'Servicios profesionales', icono: 'briefcase', reserva: PERSONAS, orden: 6,
    cargos: ['Asistente', 'Recepcionista'],
    subcategorias: [
      { codigo: 'SERVICIOS_ABOGADOS', nombre: 'Abogados', icono: 'scale', cargos: ['Abogado'] },
      { codigo: 'SERVICIOS_CONTABILIDAD', nombre: 'Contabilidad', icono: 'calculator', cargos: ['Contador'] },
      { codigo: 'SERVICIOS_ASESORIA', nombre: 'Asesoría', icono: 'messages-square', cargos: ['Asesor'] }
    ]
  },
  {
    codigo: 'ESPACIOS', nombre: 'Alquiler de espacios', icono: 'building-2', reserva: ESPACIOS, orden: 7,
    cargos: ['Recepcionista', 'Administrador'],
    subcategorias: [
      { codigo: 'ESPACIOS_SALAS_REUNIONES', nombre: 'Salas de reuniones', icono: 'presentation', cargos: [] },
      { codigo: 'ESPACIOS_COWORKING', nombre: 'Coworking', icono: 'laptop', cargos: [] }
    ]
  }
];

// Planes de ejemplo. Solo se cargan si todavía no hay ningún plan; después se editan
// desde la pantalla Planes (precios, módulos y estado).
const PLANES_EJEMPLO = [
  {
    codigo: 'BASICO',
    nombre: 'Básico',
    descripcion: 'Agenda y pacientes para empezar a recibir reservas.',
    precio: 19.99,
    orden: 1,
    modulos: ['AGENDA', 'PACIENTES']
  },
  {
    codigo: 'MEDIO',
    nombre: 'Medio',
    descripcion: 'Todo lo del Básico más mensajes, pagos y facturación.',
    precio: 39.99,
    orden: 2,
    modulos: ['AGENDA', 'PACIENTES', 'MENSAJES', 'PAGOS', 'FACTURACION']
  },
  {
    codigo: 'AVANZADO',
    nombre: 'Avanzado',
    descripcion: 'Todos los módulos de la plataforma.',
    precio: 69.99,
    orden: 3,
    modulos: ['AGENDA', 'PACIENTES', 'CONSULTAS', 'MENSAJES', 'HISTORIA_CLINICA', 'FACTURACION', 'PAGOS', 'REPORTES']
  }
];

// Pantallas que ve cada rol plantilla. El administrador de empresa no aparece
// porque ve todas las pantallas de los modulos que su empresa tiene licenciados.
const PANTALLAS_POR_ROL = {
  RECEPCION: ['INICIO_RESUMEN', 'AGENDA_HOY', 'PACIENTES_LISTA'],
  PROFESIONAL: ['INICIO_RESUMEN', 'AGENDA_HOY', 'PACIENTES_LISTA', 'PAGOS_LISTA']
};

// Pantallas que ya no se usan: se desactivan en las bases existentes (en una base nueva no se crean).
// CONFIGURACION_GENERAL se reemplazó por Roles y permisos y Usuarios.
const PANTALLAS_RETIRADAS = ['CONFIGURACION_GENERAL'];
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

async function cargarAcciones() {
  console.log('Catálogo de acciones (botones)');
  for (const accion of CATALOGO_ACCIONES) {
    const existente = await AccionesRepository.buscarPorCodigo(accion.codigo);
    if (existente) {
      console.log(`   = ${accion.codigo} ya existía (no se modifica)`);
      continue;
    }

    await AccionesRepository.crear(accion);
    console.log(`   ✓ ${accion.codigo}`);
  }
}

async function retirarPantallas() {
  console.log('Pantallas retiradas');
  for (const codigo of PANTALLAS_RETIRADAS) {
    const pantalla = await PantallasRepository.buscarPorCodigo(codigo);
    if (!pantalla || !pantalla.activo) {
      console.log(`   = ${codigo} no existe o ya está inactiva`);
      continue;
    }
    await PantallasRepository.actualizar(pantalla.id, { activo: false });
    console.log(`   ✓ ${codigo} desactivada`);
  }
}

async function cargarPlanesEjemplo() {
  console.log('Planes de ejemplo');
  if ((await PlanesRepository.contar()) > 0) {
    console.log('   = ya hay planes (no se modifican)');
    return;
  }

  for (const { modulos: codigos, ...plan } of PLANES_EJEMPLO) {
    const modulos = await Promise.all(codigos.map((codigo) => ModulosRepository.buscarPorCodigo(codigo)));
    if (modulos.some((modulo) => !modulo)) {
      throw new Error(`El plan ${plan.codigo} usa módulos que no existen`);
    }

    await prisma.$transaction(async (tx) => {
      const creado = await PlanesRepository.crear(plan, tx);
      await PlanesRepository.reemplazarModulos(creado.id, modulos.map((modulo) => modulo.id), tx);
    });
    console.log(`   ✓ ${plan.codigo} (${modulos.length} módulos)`);
  }
}

// Código de cargo: CATEGORIA + nombre en mayúsculas sin tildes ("SALUD_ODONTOLOGIA_ODONTOLOGO").
const codigoCargo = (codigoCategoria, nombre) =>
  `${codigoCategoria}_${nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}`;

async function crearCategoriaSiFalta(datos) {
  const existente = await prisma.categoriaEmpresa.findUnique({ where: { codigo: datos.codigo } });
  if (existente) {
    console.log(`   = ${datos.codigo} ya existía (no se modifica)`);
    return existente;
  }
  const creada = await prisma.categoriaEmpresa.create({ data: datos });
  console.log(`   ✓ ${datos.codigo}`);
  return creada;
}

async function crearCargosSiFaltan(categoria, nombres) {
  for (const [orden, nombre] of nombres.entries()) {
    const codigo = codigoCargo(categoria.codigo, nombre);
    if (await prisma.cargo.findUnique({ where: { codigo } })) continue;
    await prisma.cargo.create({ data: { codigo, nombre, orden: orden + 1, categoriaId: categoria.id } });
  }
}

// "Banco del Pacífico" -> "BANCO_DEL_PACIFICO"
const codigoDe = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

async function cargarCatalogos() {
  console.log('Catálogos');
  for (const { items, ...datos } of CATALOGOS_INICIALES) {
    const catalogo =
      (await prisma.catalogo.findUnique({ where: { codigo: datos.codigo } })) ||
      (await prisma.catalogo.create({ data: datos }));

    let creados = 0;
    for (const [indice, item] of items.entries()) {
      const { codigo, nombre } = typeof item === 'string' ? { codigo: codigoDe(item), nombre: item } : item;
      const existe = await prisma.catalogoItem.findUnique({
        where: { catalogoId_codigo: { catalogoId: catalogo.id, codigo } }
      });
      if (existe) continue;
      await prisma.catalogoItem.create({ data: { catalogoId: catalogo.id, codigo, nombre, orden: indice + 1 } });
      creados += 1;
    }
    console.log(`   ✓ ${datos.codigo} (${creados} valores nuevos)`);
  }
}

async function cargarCategorias() {
  console.log('Categorías de negocio y cargos');
  for (const { subcategorias, cargos, ...general } of CATEGORIAS_INICIALES) {
    const padre = await crearCategoriaSiFalta(general);
    await crearCargosSiFaltan(padre, cargos);

    for (const [indice, { cargos: cargosPropios, ...sub }] of subcategorias.entries()) {
      // La subcategoría hereda lo que se reserva de su categoría, salvo que diga otra cosa (Gimnasio).
      const hija = await crearCategoriaSiFalta({
        reserva: general.reserva,
        orden: indice + 1,
        ...sub,
        padreId: padre.id
      });
      await crearCargosSiFaltan(hija, cargosPropios);
    }
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
  await cargarAcciones();
  await cargarModulos();
  await cargarPantallas();
  await retirarPantallas();
  await cargarPlanesEjemplo();
  await cargarCatalogos();
  await cargarCategorias();
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