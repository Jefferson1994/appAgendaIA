const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const PagosController = require('../controllers/PagosController');
const Paths = require('./paths/PagosPaths');

const router = express.Router();

router.post(Paths.SOLICITAR, asyncHandler(PagosController.solicitar));

module.exports = router;