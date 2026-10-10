const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirTipoAcceso } = require('../middlewares/autorizacion');
const { TIPO_ACCESO } = require('../config/constantes');
const ConfiguracionModulosController = require('../controllers/ConfiguracionModulosController');
const Paths = require('./paths/ConfiguracionModulosPaths');

const router = express.Router();

// Administración de la plataforma: solo el super admin crea módulos, pantallas y botones.
router.use(autenticar, exigirTipoAcceso(TIPO_ACCESO.SUPER_ADMIN));

router.post(Paths.CONSULTAR, asyncHandler(ConfiguracionModulosController.consultar));
router.post(Paths.MODULO_GUARDAR, asyncHandler(ConfiguracionModulosController.guardarModulo));
router.post(Paths.MODULO_ESTADO, asyncHandler(ConfiguracionModulosController.cambiarEstadoModulo));
router.post(Paths.PANTALLA_GUARDAR, asyncHandler(ConfiguracionModulosController.guardarPantalla));
router.post(Paths.PANTALLA_ESTADO, asyncHandler(ConfiguracionModulosController.cambiarEstadoPantalla));
router.post(Paths.PANTALLA_ACCIONES, asyncHandler(ConfiguracionModulosController.asignarAcciones));
router.post(Paths.BOTON_ELIMINAR, asyncHandler(ConfiguracionModulosController.eliminarBoton));

module.exports = router;
