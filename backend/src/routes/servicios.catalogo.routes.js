const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const CatalogoServiciosController = require('../controllers/CatalogoServiciosController');
const Paths = require('./paths/CatalogoServiciosPaths');

const router = express.Router();

router.post(
  Paths.CONSULTAR,
  autenticar,
  exigirPermiso(PERMISOS.SERVICIOS_VER),
  asyncHandler(CatalogoServiciosController.consultar)
);
router.post(
  Paths.GUARDAR,
  autenticar,
  exigirPermiso(PERMISOS.SERVICIOS_GESTIONAR),
  asyncHandler(CatalogoServiciosController.guardar)
);
router.post(
  Paths.ESTADO,
  autenticar,
  exigirPermiso(PERMISOS.SERVICIOS_GESTIONAR),
  asyncHandler(CatalogoServiciosController.cambiarEstado)
);

module.exports = router;