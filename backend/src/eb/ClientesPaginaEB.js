const ClienteListaEB = require('./ClienteListaEB');

const SIN_CITAS = { totalCitas: 0, ultimaCita: null, proximaCita: null };

// Respuesta de la pantalla de clientes: una página de clientes con su resumen de citas.
// `resumenes` es un Map clienteId -> { totalCitas, ultimaCita, proximaCita }.
class ClientesPaginaEB {
  constructor({ clientes, resumenes, total, pagina, tamano, zona }) {
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