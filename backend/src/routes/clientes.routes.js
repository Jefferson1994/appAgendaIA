const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const PacientesController = require('../controllers/PacientesController');
const legacyRouter = require('./pacientes.routes');

const router = express.Router();

// Alias de compatibilidad: mantiene GET/POST /clientes igual que /leads.
router.use('/', legacyRouter);
// Entrada usada por n8n: la organización se obtiene del canal activo.
router.post('/registrar', asyncHandler(PacientesController.registrarPorCanal));

module.exports = router;
