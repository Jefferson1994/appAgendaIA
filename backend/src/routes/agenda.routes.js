const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const AgendaController = require('../controllers/AgendaController');
const Paths = require('./paths/AgendaPaths');

const router = express.Router();

const ver = exigirPermiso(PERMISOS.CITAS_VER);
const gestionar = exigirPermiso(PERMISOS.CITAS_GESTIONAR);

router.use(autenticar);

router.post(Paths.CONSULTAR, ver, asyncHandler(AgendaController.consultar));
router.post(Paths.OPCIONES, ver, asyncHandler(AgendaController.opciones));
router.post(Paths.DISPONIBILIDAD, gestionar, asyncHandler(AgendaController.disponibilidad));
router.post(Paths.CLIENTES, gestionar, asyncHandler(AgendaController.buscarClientes));
router.post(Paths.CREAR, gestionar, asyncHandler(AgendaController.crear));
router.post(Paths.ESTADO, gestionar, asyncHandler(AgendaController.cambiarEstado));

module.exports = router;
