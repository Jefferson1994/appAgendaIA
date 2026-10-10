// Un rol con sus pantallas y botones (ids), para la pantalla de roles.
// `EsPlantilla` = rol del sistema que ven todas las empresas. `Editable` = el usuario puede modificarlo.
class RolConfiguracionEB {
  constructor(rol, { editable }) {
    this.Id = rol.id;
    this.Codigo = rol.codigo;
    this.Nombre = rol.nombre;
    this.Descripcion = rol.descripcion || null;
    this.Alcance = rol.alcance;
    this.Activo = rol.activo;
    this.EsPlantilla = rol.organizacionId === null;
    this.Editable = editable;
    this.Usuarios = rol._count ? rol._count.usuarios : 0;
    this.PantallaIds = (rol.pantallas || []).map((rolPantalla) => rolPantalla.pantallaId);
    this.PermisoIds = (rol.permisos || []).map((rolPermiso) => rolPermiso.permisoId);
  }
}

module.exports = RolConfiguracionEB;
