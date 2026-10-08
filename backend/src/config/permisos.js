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
  ROLES_GESTIONAR: 'roles.gestionar'
};

module.exports = { PERMISOS };