const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const subirArchivo = require('../middlewares/subirArchivo');
const DocumentosController = require('../controllers/DocumentosController');
const Paths = require('./paths/DocumentosPaths');

const router = express.Router();

// Cualquier usuario autenticado sube y ve archivos de su propia empresa (lo valida el servicio).
router.use(autenticar);

router.post(Paths.SUBIR, subirArchivo, asyncHandler(DocumentosController.subir));
router.get(Paths.ARCHIVO, asyncHandler(DocumentosController.archivo));

module.exports = router;
