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
const configuracionModulosRoutes = require('./routes/configuracion.modulos.routes');
const ConfiguracionModulosPaths = require('./routes/paths/ConfiguracionModulosPaths');
const planesRoutes = require('./routes/planes.routes');
const PlanesPaths = require('./routes/paths/PlanesPaths');
const suscripcionRoutes = require('./routes/suscripcion.routes');
const SuscripcionPaths = require('./routes/paths/SuscripcionPaths');
const rolesRoutes = require('./routes/roles.routes');
const RolesPaths = require('./routes/paths/RolesPaths');
const usuariosRoutes = require('./routes/usuarios.routes');
const UsuariosPaths = require('./routes/paths/UsuariosPaths');
const categoriasRoutes = require('./routes/categorias.routes');
const CategoriasPaths = require('./routes/paths/CategoriasPaths');
const catalogosRoutes = require('./routes/catalogos.routes');
const CatalogosPaths = require('./routes/paths/CatalogosPaths');
const documentosRoutes = require('./routes/documentos.routes');
const DocumentosPaths = require('./routes/paths/DocumentosPaths');
const cobrosRoutes = require('./routes/cobros.routes');
const CobrosPaths = require('./routes/paths/CobrosPaths');
const perfilRoutes = require('./routes/perfil.routes');
const PerfilPaths = require('./routes/paths/PerfilPaths');


const app = express();
app.use(cors());
app.use(express.json());
app.use(limitadorGeneral);
// Estas rutas son consultas (aunque usen POST): solo cuentan para el límite general.
const RUTAS_DE_CONSULTA = [
  AgendaPaths.BASE,
  `${ClientesConsultaPaths.BASE}${ClientesConsultaPaths.CONSULTAR}`,
  `${CatalogoServiciosPaths.BASE}${CatalogoServiciosPaths.CONSULTAR}`,
  `${ConfiguracionModulosPaths.BASE}${ConfiguracionModulosPaths.CONSULTAR}`,
  `${PlanesPaths.BASE}${PlanesPaths.CONSULTAR}`,
  `${SuscripcionPaths.BASE}${SuscripcionPaths.CONSULTAR}`,
  `${RolesPaths.BASE}${RolesPaths.CONSULTAR}`,
  `${UsuariosPaths.BASE}${UsuariosPaths.CONSULTAR}`,
  `${CategoriasPaths.BASE}${CategoriasPaths.CONSULTAR}`,
  `${CategoriasPaths.BASE}${CategoriasPaths.PUBLICAS}`,
  `${CatalogosPaths.BASE}${CatalogosPaths.CONSULTAR}`,
  `${CobrosPaths.BASE}${CobrosPaths.CONSULTAR}`,
  `${CobrosPaths.BASE}${CobrosPaths.MIOS_CONSULTAR}`,
  `${PerfilPaths.BASE}${PerfilPaths.CONSULTAR}`
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
app.use(ConfiguracionModulosPaths.BASE, configuracionModulosRoutes);
app.use(PlanesPaths.BASE, planesRoutes);
app.use(SuscripcionPaths.BASE, suscripcionRoutes);
app.use(RolesPaths.BASE, rolesRoutes);
app.use(UsuariosPaths.BASE, usuariosRoutes);
app.use(CategoriasPaths.BASE, categoriasRoutes);
app.use(CatalogosPaths.BASE, catalogosRoutes);
app.use(DocumentosPaths.BASE, documentosRoutes);
app.use(CobrosPaths.BASE, cobrosRoutes);
app.use(PerfilPaths.BASE, perfilRoutes);

// Debe ir al final de las rutas.
app.use(errorHandler);

module.exports = app;