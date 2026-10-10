const { CODIGOS_DEL_SISTEMA } = require('../config/permisos');
const AccionEB = require('./AccionEB');

// Un botón de pantalla (permiso) con la acción del catálogo que representa.
// `Accion` es null en los permisos que no vienen del catálogo (ej. citas.gestionar).
// `DelSistema` = lo revisa el backend y no se puede eliminar.
class BotonConfiguracionEB {
  constructor(permiso) {
    this.Id = permiso.id;
    this.Codigo = permiso.codigo;
    this.Descripcion = permiso.descripcion || null;
    this.Categoria = permiso.categoria || null;
    this.PantallaId = permiso.pantallaId || null;
    this.Accion = permiso.accion ? new AccionEB(permiso.accion) : null;
    this.RolesAsignados = permiso._count ? permiso._count.roles : 0;
    this.DelSistema = CODIGOS_DEL_SISTEMA.has(permiso.codigo);
  }
}

module.exports = BotonConfiguracionEB;
