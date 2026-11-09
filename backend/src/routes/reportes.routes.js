// Rutas de reportes: /api/reportes   (todas aceptan ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD)
const express = require('express');
const ctrl = require('../controllers/reportes.controller');
const v = require('../validators/reportes.validator');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/resumen', asyncHandler(ctrl.resumen));
router.get('/consultas-por-medico', validar(v.rango), asyncHandler(ctrl.consultasPorMedico));
router.get('/asistencia-citas', validar(v.rango), asyncHandler(ctrl.asistenciaCitas));
router.get('/diagnosticos-frecuentes', validar(v.rango), asyncHandler(ctrl.diagnosticosFrecuentes));
router.get('/medicamentos-mas-recetados', validar(v.rango), asyncHandler(ctrl.medicamentosMasRecetados));
router.get('/pacientes-frecuentes', validar(v.rango), asyncHandler(ctrl.pacientesFrecuentes));

module.exports = router;
