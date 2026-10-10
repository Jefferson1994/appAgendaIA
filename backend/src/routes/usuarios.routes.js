const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const UsuariosController = require('../controllers/UsuariosController');
const Paths = require('./paths/UsuariosPaths');

const router = express.Router();

router.use(autenticar, exigirPermiso(PERMISOS.USUARIOS_GESTIONAR));

router.post(Paths.CONSULTAR, asyncHandler(UsuariosController.consultar));
router.post(Paths.GUARDAR, asyncHandler(UsuariosController.guardar));
router.post(Paths.ESTADO, asyncHandler(UsuariosController.cambiarEstado));
router.post(Paths.RESTABLECER_CLAVE, asyncHandler(UsuariosController.restablecerClave));

module.exports = router;
