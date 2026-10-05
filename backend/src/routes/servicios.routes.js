const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const ServiciosController = require('../controllers/ServiciosController');
const Paths = require('./paths/ServiciosPaths');

const router = express.Router();

router.get(Paths.LISTAR, asyncHandler(ServiciosController.listar));
router.get(Paths.POR_ID, asyncHandler(ServiciosController.obtenerPorId));

module.exports = router;