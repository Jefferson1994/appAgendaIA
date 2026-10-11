const ClienteListaEB = require('./ClienteListaEB');

const SIN_CITAS = { totalCitas: 0, ultimaCita: null, proximaCita: null, profesionales: [] };

// Respuesta de la pantalla de clientes: una página de clientes con su resumen de citas.
// `resumenes` es un Map clienteId -> { totalCitas, ultimaCita, proximaCita, profesionales }.
class ClientesPaginaEB {
  constructor({ clientes, resumenes, total, pagina, tamano, zona, empresas, termino, soloPropio }) {
    // Solo el super admin recibe las empresas.
    this.Empresas = empresas
      ? empresas.map((empresa) => ({ Id: empresa.id, Nombre: empresa.nombreComercial || empresa.nombre }))
      : null;
    // Cómo llama el negocio a sus clientes (Pacientes, Clientes).
    this.Termino = termino;
    this.SoloPropio = soloPropio;
    this.Total = total;
    this.Pagina = pagina;
    this.Tamano = tamano;
    this.TotalPaginas = Math.ceil(total / tamano);
    this.Clientes = clientes.map(
      (cliente) => new ClienteListaEB(cliente, resumenes.get(cliente.id) || SIN_CITAS, zona)
    );
  }
}

module.exports = ClientesPaginaEB;
