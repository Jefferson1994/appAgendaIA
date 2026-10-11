const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const { exigirPermiso } = require('../middlewares/autorizacion');
const { PERMISOS } = require('../config/permisos');
const EmpresaController = require('../controllers/EmpresaController');
const Paths = require('./paths/EmpresaPaths');

const router = express.Router();

router.use(autenticar, exigirPermiso(PERMISOS.EMPRESA_GESTIONAR));

router.post(Paths.CONSULTAR, asyncHandler(EmpresaController.consultar));
router.post(Paths.HORARIO, asyncHandler(EmpresaController.guardarHorario));

module.exports = router;
