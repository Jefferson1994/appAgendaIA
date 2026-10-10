const RolConfiguracionEB = require('./RolConfiguracionEB');
const { esEditable } = require('../services/RolesService');

// Un botón del catálogo de roles: nombre de su acción (Ver, Editar...) o su descripción.
const boton = (permiso) => ({
  Id: permiso.id,
  Codigo: permiso.codigo,
  Nombre: (permiso.accion && permiso.accion.nombre) || permiso.descripcion || permiso.codigo,
  Icono: (permiso.accion && permiso.accion.icono) || null
});

// Respuesta de POST /roles/consultar: roles (plantillas y propios) y lo que se les puede asignar.
// `Reserva`: qué reserva el negocio de la empresa (null para el super admin).
class RolesEB {
  constructor({ roles, ambito, pantallas, generales, reserva = null }) {
    this.Reserva = reserva;
    this.Roles = roles.map((rol) => new RolConfiguracionEB(rol, { editable: esEditable(rol, ambito) }));
    this.Pantallas = pantallas.map((pantalla) => ({
      Id: pantalla.id,
      Codigo: pantalla.codigo,
      Nombre: pantalla.nombre,
      Icono: pantalla.icono || null,
      Modulo: { Id: pantalla.modulo.id, Nombre: pantalla.modulo.nombre, Orden: pantalla.modulo.orden },
      Botones: pantalla.permisos.map(boton)
    }));
    this.PermisosGenerales = generales.map((permiso) => ({
      Id: permiso.id,
      Codigo: permiso.codigo,
      Descripcion: permiso.descripcion || permiso.codigo
    }));
  }
}

module.exports = RolesEB;
