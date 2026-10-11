const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const InicioController = require('../controllers/InicioController');
const Paths = require('./paths/InicioPaths');

const router = express.Router();

// Todo usuario con sesión ve su Inicio; el servicio decide qué bloques puede ver.
router.use(autenticar);

router.post(Paths.RESUMEN, asyncHandler(InicioController.resumen));

module.exports = router;
