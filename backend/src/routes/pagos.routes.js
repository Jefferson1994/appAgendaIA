const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const PagosController = require('../controllers/PagosController');
const Paths = require('./paths/PagosPaths');

const router = express.Router();

router.post(Paths.SOLICITAR, asyncHandler(PagosController.solicitar));
router.get(Paths.ESTADO, asyncHandler(PagosController.consultarEstado));

module.exports = router;
