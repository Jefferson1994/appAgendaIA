const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const { limitadorAutenticacion } = require('../middlewares/limitadores');
const AuthController = require('../controllers/AuthController');
const Paths = require('./paths/AuthPaths');
const autenticar = require('../middlewares/autenticar');

const router = express.Router();

router.post(Paths.REGISTRO_EMPRESA, limitadorAutenticacion, asyncHandler(AuthController.registrarEmpresa));
router.post(Paths.LOGIN, limitadorAutenticacion, asyncHandler(AuthController.login));
router.post(Paths.REFRESH, limitadorAutenticacion, asyncHandler(AuthController.refrescar));
router.post(Paths.LOGOUT, asyncHandler(AuthController.logout));
router.get(Paths.YO, autenticar, asyncHandler(AuthController.yo))


// GET Paths.YO se agrega cuando exista el middleware "autenticar".

module.exports = router;