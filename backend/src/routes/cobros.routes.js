const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const CobrosController = require('../controllers/CobrosController');
const Paths = require('./paths/CobrosPaths');

const router = express.Router();

router.use(autenticar);

// El profesional administra sus propias cuentas (el servicio exige que sea profesional).
router.post(Paths.MIOS_CONSULTAR, asyncHandler(CobrosController.consultarMios));
router.post(Paths.MIOS_GUARDAR, asyncHandler(CobrosController.guardarMio));
router.post(Paths.MIOS_ESTADO, asyncHandler(CobrosController.cambiarEstadoMio));

// El administrador: política de cobro y cuentas de la empresa.
const gestionar = exigirPermiso(PERMISOS.COBROS_GESTIONAR);
router.post(Paths.CONSULTAR, gestionar, asyncHandler(CobrosController.consultar));
router.post(Paths.POLITICA, gestionar, asyncHandler(CobrosController.guardarPolitica));
router.post(Paths.MEDIO_GUARDAR, gestionar, asyncHandler(CobrosController.guardarMedio));
router.post(Paths.MEDIO_ESTADO, gestionar, asyncHandler(CobrosController.cambiarEstadoMedio));

module.exports = router;
