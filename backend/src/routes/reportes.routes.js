const express = require('express');
const ctrl = require('../controllers/reportes.controller');
const v = require('../validators/reportes.validator');
const validar = require('../middlewares/validar');

const router = express.Router();

router.get('/resumen', ctrl.resumen);
router.get('/consultas-por-medico', validar(v.rango), ctrl.consultasPorMedico);
router.get('/asistencia-citas', validar(v.rango), ctrl.asistenciaCitas);
router.get('/diagnosticos-frecuentes', validar(v.rango), ctrl.diagnosticosFrecuentes);
router.get('/medicamentos-mas-recetados', validar(v.rango), ctrl.medicamentosMasRecetados);
router.get('/pacientes-frecuentes', validar(v.rango), ctrl.pacientesFrecuentes);

module.exports = router;
