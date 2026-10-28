const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const PagosController = require('../controllers/PagosController');
const Paths = require('./paths/PagosPaths');

const router = express.Router();

// Herramientas del bot y confirmación de transferencia por el cliente.
router.post(Paths.SOLICITAR, asyncHandler(PagosController.solicitar));
router.get(Paths.OPCIONES, asyncHandler(PagosController.opciones));
router.get(Paths.ESTADO, asyncHandler(PagosController.consultarEstado));
router.post(Paths.MANUAL_REPORTAR, asyncHandler(PagosController.reportarManual));

// Panel administrativo: solo personal con permiso de citas puede validar y confirmar cobros.
router.use(autenticar);
const gestionar = exigirPermiso(PERMISOS.CITAS_GESTIONAR);
router.post(Paths.MANUAL_CONFIRMAR, gestionar, asyncHandler(PagosController.confirmarManual));
router.get(Paths.MANUAL_PENDIENTES, gestionar, asyncHandler(PagosController.pendientesManual));

module.exports = router;
