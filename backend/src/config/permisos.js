// Códigos de permiso que el código del backend revisa. Su descripción, su categoría y
// qué rol los tiene viven en la base de datos (se cargan con prisma/seed-acceso.js).
const PERMISOS = {
  CITAS_VER: 'citas.ver',
  CITAS_GESTIONAR: 'citas.gestionar',
  CLIENTES_VER: 'clientes.ver',
  SERVICIOS_VER: 'servicios.ver',
  SERVICIOS_GESTIONAR: 'servicios.gestionar',
  PROFESIONALES_VER: 'profesionales.ver',
  PROFESIONALES_GESTIONAR: 'profesionales.gestionar',
  PAGOS_VER: 'pagos.ver',
  USUARIOS_GESTIONAR: 'usuarios.gestionar',
  ROLES_GESTIONAR: 'roles.gestionar',
  // Administración de la plataforma (solo super admin)
  MODULOS_GESTIONAR: 'modulos.gestionar',
  PLANES_GESTIONAR: 'planes.gestionar',
  CATEGORIAS_GESTIONAR: 'categorias.gestionar',
  CATALOGOS_GESTIONAR: 'catalogos.gestionar',
  // Cuentas y billeteras de la empresa, y si cada profesional cobra en las suyas
  COBROS_GESTIONAR: 'cobros.gestionar',
  // Suscripción de la empresa (administrador de empresa)
  SUSCRIPCION_GESTIONAR: 'suscripcion.gestionar'
};

// Los revisa exigirPermiso: borrarlos o renombrarlos rompería la autorización.
const CODIGOS_DEL_SISTEMA = new Set(Object.values(PERMISOS));

// Permisos de administración de la plataforma: nunca se asignan a roles de empresa.
const PERMISOS_PLATAFORMA = new Set([
  PERMISOS.MODULOS_GESTIONAR,
  PERMISOS.PLANES_GESTIONAR,
  PERMISOS.CATEGORIAS_GESTIONAR,
  PERMISOS.CATALOGOS_GESTIONAR
]);

module.exports = { PERMISOS, CODIGOS_DEL_SISTEMA, PERMISOS_PLATAFORMA };