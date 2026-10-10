const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirTipoAcceso } = require('../middlewares/autorizacion');
const { TIPO_ACCESO } = require('../config/constantes');
const CatalogosController = require('../controllers/CatalogosController');
const Paths = require('./paths/CatalogosPaths');

const router = express.Router();

// Catálogos de la plataforma: solo el super admin administra sus valores.
router.use(autenticar, exigirTipoAcceso(TIPO_ACCESO.SUPER_ADMIN));

router.post(Paths.CONSULTAR, asyncHandler(CatalogosController.consultar));
router.post(Paths.ITEM_GUARDAR, asyncHandler(CatalogosController.guardarItem));
router.post(Paths.ITEM_ESTADO, asyncHandler(CatalogosController.cambiarEstadoItem));

module.exports = router;
