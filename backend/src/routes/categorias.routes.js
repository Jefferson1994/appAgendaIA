const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirTipoAcceso } = require('../middlewares/autorizacion');
const { TIPO_ACCESO } = require('../config/constantes');
const CategoriasController = require('../controllers/CategoriasController');
const Paths = require('./paths/CategoriasPaths');

const router = express.Router();

// Público: el registro de empresa muestra los tipos de negocio antes de que exista una sesión.
router.post(Paths.PUBLICAS, asyncHandler(CategoriasController.publicas));

// Catálogo de la plataforma: solo el super admin crea categorías y cargos.
router.use(autenticar, exigirTipoAcceso(TIPO_ACCESO.SUPER_ADMIN));

router.post(Paths.CONSULTAR, asyncHandler(CategoriasController.consultar));
router.post(Paths.GUARDAR, asyncHandler(CategoriasController.guardar));
router.post(Paths.ESTADO, asyncHandler(CategoriasController.cambiarEstado));
router.post(Paths.CARGO_GUARDAR, asyncHandler(CategoriasController.guardarCargo));
router.post(Paths.CARGO_ESTADO, asyncHandler(CategoriasController.cambiarEstadoCargo));

module.exports = router;
