const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const IntegracionesController = require('../controllers/IntegracionesController');
const Paths = require('./paths/IntegracionesPaths');

const router = express.Router();
router.get(Paths.GOOGLE_CALLBACK, asyncHandler(IntegracionesController.callbackGoogle));
router.use(autenticar);
router.post(Paths.GOOGLE_AUTORIZAR, asyncHandler(IntegracionesController.autorizarGoogle));
router.post(Paths.GOOGLE_CONSULTAR, asyncHandler(IntegracionesController.consultarGoogle));

module.exports = router;
