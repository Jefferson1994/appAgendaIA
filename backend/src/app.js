const express = require('express');
const cors = require('cors');

const pacientesRoutes = require('./modules/pacientes/pacientes.routes');
const serviciosRoutes = require('./modules/servicios/servicios.routes');
const disponibilidadRoutes = require('./modules/disponibilidad/disponibilidad.routes');
const contextoRoutes = require('./modules/contexto/contexto.routes');
const citasRoutes = require('./modules/citas/citas.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  ok: true,
  mensaje: 'Backend Agenda IA corriendo'
}));

app.use('/leads', pacientesRoutes);
app.use('/servicios', serviciosRoutes);
app.use('/disponibilidad', disponibilidadRoutes);
app.use('/contexto', contextoRoutes);
app.use('/citas', citasRoutes);

module.exports = app;
