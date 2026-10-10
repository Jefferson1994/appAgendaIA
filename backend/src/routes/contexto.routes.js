const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const ContextoController = require('../controllers/ContextoController');
const Paths = require('./paths/ContextoPaths');

const router = express.Router();

router.get(Paths.POR_CANAL, asyncHandler(ContextoController.resolverPorCanal));
router.get(Paths.MEDIOS_COBRO, asyncHandler(ContextoController.mediosCobro));
router.get(Paths.QR_MEDIO_COBRO, asyncHandler(ContextoController.qrMedioCobro));

module.exports = router;