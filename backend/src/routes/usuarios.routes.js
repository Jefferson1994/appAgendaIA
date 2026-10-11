const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const UsuariosController = require('../controllers/UsuariosController');
const Paths = require('./paths/UsuariosPaths');

const router = express.Router();

// Entrar a la pantalla exige usuarios.gestionar; cada botón, su propio permiso.
router.use(autenticar, exigirPermiso(PERMISOS.USUARIOS_GESTIONAR));

router.post(Paths.CONSULTAR, asyncHandler(UsuariosController.consultar));
// Crear o editar según el body: el controlador revisa usuarios.crear o usuarios.editar.
router.post(Paths.GUARDAR, asyncHandler(UsuariosController.guardar));
router.post(Paths.ESTADO, exigirPermiso(PERMISOS.USUARIOS_CAMBIAR_ESTADO), asyncHandler(UsuariosController.cambiarEstado));
router.post(
  Paths.RESTABLECER_CLAVE,
  exigirPermiso(PERMISOS.USUARIOS_RESTABLECER_CLAVE),
  asyncHandler(UsuariosController.restablecerClave)
);

module.exports = router;
