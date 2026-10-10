const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const RolesController = require('../controllers/RolesController');
const Paths = require('./paths/RolesPaths');

const router = express.Router();

router.use(autenticar, exigirPermiso(PERMISOS.ROLES_GESTIONAR));

router.post(Paths.CONSULTAR, asyncHandler(RolesController.consultar));
router.post(Paths.GUARDAR, asyncHandler(RolesController.guardar));
router.post(Paths.ESTADO, asyncHandler(RolesController.cambiarEstado));

module.exports = router;
