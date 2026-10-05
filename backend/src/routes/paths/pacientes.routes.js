const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const PacientesController = require('../controllers/PacientesController');
const Paths = require('./paths/PacientesPaths');

const router = express.Router();

router.get(Paths.LISTAR, asyncHandler(PacientesController.listar));
router.post(Paths.REGISTRAR, asyncHandler(PacientesController.registrar));

module.exports = router;