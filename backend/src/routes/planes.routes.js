const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirTipoAcceso } = require('../middlewares/autorizacion');
const { TIPO_ACCESO } = require('../config/constantes');
const PlanesController = require('../controllers/PlanesController');
const Paths = require('./paths/PlanesPaths');

const router = express.Router();

// Catálogo comercial de la plataforma: solo el super admin crea planes y fija precios.
router.use(autenticar, exigirTipoAcceso(TIPO_ACCESO.SUPER_ADMIN));

router.post(Paths.CONSULTAR, asyncHandler(PlanesController.consultar));
router.post(Paths.GUARDAR, asyncHandler(PlanesController.guardar));
router.post(Paths.ESTADO, asyncHandler(PlanesController.cambiarEstado));
router.post(Paths.PRECIO_MODULO, asyncHandler(PlanesController.guardarPrecioModulo));

module.exports = router;
