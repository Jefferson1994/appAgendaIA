const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirTipoAcceso } = require('../middlewares/autorizacion');
const { TIPO_ACCESO } = require('../config/constantes');
const SuscripcionController = require('../controllers/SuscripcionController');
const Paths = require('./paths/SuscripcionPaths');

const router = express.Router();

// Solo el administrador de la empresa cambia el plan o compra módulos de su empresa.
router.use(autenticar, exigirTipoAcceso(TIPO_ACCESO.ADMIN_EMPRESA));

router.post(Paths.CONSULTAR, asyncHandler(SuscripcionController.consultar));
router.post(Paths.CAMBIAR_PLAN, asyncHandler(SuscripcionController.cambiarPlan));
router.post(Paths.COMPRAR_MODULO, asyncHandler(SuscripcionController.comprarModulo));
router.post(Paths.CANCELAR_MODULO, asyncHandler(SuscripcionController.cancelarModulo));

module.exports = router;
