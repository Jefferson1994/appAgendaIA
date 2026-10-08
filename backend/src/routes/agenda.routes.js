const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const AgendaController = require('../controllers/AgendaController');
const Paths = require('./paths/AgendaPaths');

const router = express.Router();

router.post(
  Paths.CONSULTAR,
  autenticar,
  exigirPermiso(PERMISOS.CITAS_VER),
  asyncHandler(AgendaController.consultar)
);

module.exports = router;