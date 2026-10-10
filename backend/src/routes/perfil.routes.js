const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { limitadorAutenticacion } = require('../middlewares/limitadores');
const PerfilController = require('../controllers/PerfilController');
const Paths = require('./paths/PerfilPaths');

const router = express.Router();

// Todo usuario autenticado edita su propio perfil.
router.use(autenticar);

router.post(Paths.CONSULTAR, asyncHandler(PerfilController.consultar));
router.post(Paths.GUARDAR, asyncHandler(PerfilController.guardar));
// Pide la clave actual: mismo límite que el login para frenar intentos repetidos.
router.post(Paths.CAMBIAR_CORREO, limitadorAutenticacion, asyncHandler(PerfilController.cambiarCorreo));

module.exports = router;
