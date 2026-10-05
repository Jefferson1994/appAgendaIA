const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const DisponibilidadController = require('../controllers/DisponibilidadController');
const Paths = require('./paths/DisponibilidadPaths');

const router = express.Router();

router.get(Paths.CONSULTAR, asyncHandler(DisponibilidadController.consultar));

module.exports = router;