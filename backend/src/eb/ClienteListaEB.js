const { DateTime } = require('luxon');

const aFecha = (fecha, zona) =>
  fecha ? DateTime.fromJSDate(fecha, { zone: zona }).toISODate() : null;

// Un cliente en la lista, con el resumen de sus citas. Las fechas van en la zona horaria de la empresa.
class ClienteListaEB {
  constructor(cliente, resumen, zona) {
    this.Id = cliente.id;
    this.Nombre = [cliente.nombre, cliente.apellido].filter(Boolean).join(' ');
    this.Telefono = cliente.telefono;
    this.Email = cliente.email || null;
    this.Direccion = cliente.direccion || null;
    this.TotalCitas = resumen.totalCitas;
    this.UltimaCita = aFecha(resumen.ultimaCita, zona);
    this.ProximaCita = aFecha(resumen.proximaCita, zona);
  }
}

module.exports = ClienteListaEB;