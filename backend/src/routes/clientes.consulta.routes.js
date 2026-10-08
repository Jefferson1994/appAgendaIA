const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const ClientesController = require('../controllers/ClientesController');
const Paths = require('./paths/ClientesConsultaPaths');

const router = express.Router();

router.post(
  Paths.CONSULTAR,
  autenticar,
  exigirPermiso(PERMISOS.CLIENTES_VER),
  asyncHandler(ClientesController.consultar)
);

module.exports = router;