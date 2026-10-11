const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const RecursosController = require('../controllers/RecursosController');
const Paths = require('./paths/RecursosPaths');

const router = express.Router();

// Profesionales e instalaciones. El permiso (profesionales.* o instalaciones.*) depende del
// tipo que viene en el body: lo revisa RecursosService.
router.use(autenticar);

router.post(Paths.CONSULTAR, asyncHandler(RecursosController.consultar));
router.post(Paths.GUARDAR, asyncHandler(RecursosController.guardar));
router.post(Paths.ESTADO, asyncHandler(RecursosController.cambiarEstado));

module.exports = router;
