const express = require('express');
const cors = require('cors');

const pacientesRoutes = require('./routes/pacientes.routes');
const PacientesPaths = require('./routes/paths/PacientesPaths');
const clientesRoutes = require('./routes/clientes.routes');
const ClientesPaths = require('./routes/paths/ClientesPaths');
const serviciosRoutes = require('./routes/servicios.routes');
const ServiciosPaths = require('./routes/paths/ServiciosPaths');
const disponibilidadRoutes = require('./routes/disponibilidad.routes');
const DisponibilidadPaths = require('./routes/paths/DisponibilidadPaths');
const contextoRoutes = require('./routes/contexto.routes');
const ContextoPaths = require('./routes/paths/ContextoPaths');
const citasRoutes = require('./routes/citas.routes');
const CitasPaths = require('./routes/paths/CitasPaths');
const pagosRoutes = require('./routes/pagos.routes');
const PagosPaths = require('./routes/paths/PagosPaths');
const pagosWebhooksRoutes = require('./routes/pagos.webhooks.routes');
const WebhooksPagosPaths = require('./routes/paths/WebhooksPagosPaths');
const authRoutes = require('./routes/auth.routes');
const AuthPaths = require('./routes/paths/AuthPaths');
const agendaRoutes = require('./routes/agenda.routes');
const AgendaPaths = require('./routes/paths/AgendaPaths');
const errorHandler = require('./middlewares/errorHandler');
const { limitadorGeneral, limitadorEscritura } = require('./middlewares/limitadores');
const clientesConsultaRoutes = require('./routes/clientes.consulta.routes');
const ClientesConsultaPaths = require('./routes/paths/ClientesConsultaPaths');
const serviciosCatalogoRoutes = require('./routes/servicios.catalogo.routes');
const CatalogoServiciosPaths = require('./routes/paths/CatalogoServiciosPaths');


const app = express();
app.use(cors());
app.use(express.json());
app.use(limitadorGeneral);
// Estas rutas son consultas (aunque usen POST): solo cuentan para el límite general.
const RUTAS_DE_CONSULTA = [
  AgendaPaths.BASE,
  `${ClientesConsultaPaths.BASE}${ClientesConsultaPaths.CONSULTAR}`,
  `${CatalogoServiciosPaths.BASE}${CatalogoServiciosPaths.CONSULTAR}`
];
app.post('*', (req, res, next) =>
  RUTAS_DE_CONSULTA.some((ruta) => req.path.startsWith(ruta)) ? next() : limitadorEscritura(req, res, next)
);

app.get('/health', (req, res) => res.json({
  ok: true,
  mensaje: 'Backend Agenda IA corriendo'
}));

app.use(PacientesPaths.BASE, pacientesRoutes);
app.use(ClientesConsultaPaths.BASE, clientesConsultaRoutes);
app.use(ClientesPaths.BASE, clientesRoutes);
app.use(ClientesPaths.BASE, clientesRoutes);
app.use(CatalogoServiciosPaths.BASE, serviciosCatalogoRoutes);
app.use(ServiciosPaths.BASE, serviciosRoutes);
app.use(ServiciosPaths.BASE, serviciosRoutes);
app.use(DisponibilidadPaths.BASE, disponibilidadRoutes);
app.use(ContextoPaths.BASE, contextoRoutes);
app.use(CitasPaths.BASE, citasRoutes);
app.use(PagosPaths.BASE, pagosRoutes);
app.use(WebhooksPagosPaths.BASE, pagosWebhooksRoutes);
app.use(AuthPaths.BASE, authRoutes);
app.use(AgendaPaths.BASE, agendaRoutes);

// Debe ir al final de las rutas.
app.use(errorHandler);

module.exports = app;