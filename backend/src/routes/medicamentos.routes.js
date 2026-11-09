// Rutas del catálogo de medicamentos: /api/medicamentos
const express = require('express');
const ctrl = require('../controllers/medicamentos.controller');
const v = require('../validators/medicamentos.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', validar(v.obtener), asyncHandler(ctrl.obtener));
router.post('/', logProceso('Agregar medicamento'), validar(v.crear), asyncHandler(ctrl.crear));
router.put('/:id', logProceso('Actualizar medicamento'), validar(v.actualizar), asyncHandler(ctrl.actualizar));
router.delete('/:id', logProceso('Eliminar medicamento'), validar(v.eliminar), asyncHandler(ctrl.eliminar));

module.exports = router;
