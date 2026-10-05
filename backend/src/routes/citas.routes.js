const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const CitasController = require('../controllers/CitasController');
const Paths = require('./paths/CitasPaths');

const router = express.Router();

router.post(Paths.RESERVAR, asyncHandler(CitasController.reservar));

module.exports = router;