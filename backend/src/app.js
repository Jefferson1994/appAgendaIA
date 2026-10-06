const express = require('express');
const cors = require('cors');

const pacientesRoutes = require('./routes/pacientes.routes');
const PacientesPaths = require('./routes/paths/PacientesPaths');
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
const errorHandler = require('./middlewares/errorHandler');
const { limitadorGeneral, limitadorEscritura } = require('./middlewares/limitadores');

const app = express();
app.use(cors());
app.use(express.json());
app.use(limitadorGeneral);
app.post('*', limitadorEscritura);

app.get('/health', (req, res) => res.json({
  ok: true,
  mensaje: 'Backend Agenda IA corriendo'
}));

app.use(PacientesPaths.BASE, pacientesRoutes);
app.use(ServiciosPaths.BASE, serviciosRoutes);
app.use(DisponibilidadPaths.BASE, disponibilidadRoutes);
app.use(ContextoPaths.BASE, contextoRoutes);
app.use(CitasPaths.BASE, citasRoutes);
app.use(PagosPaths.BASE, pagosRoutes);
app.use(WebhooksPagosPaths.BASE, pagosWebhooksRoutes);

// Debe ir al final de las rutas.
app.use(errorHandler);

module.exports = app;
