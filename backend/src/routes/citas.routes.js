// Rutas de citas: /api/citas
const express = require('express');
const ctrl = require('../controllers/citas.controller');
const v = require('../validators/citas.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', validar(v.listar), asyncHandler(ctrl.listar));
router.get('/:id', validar(v.obtener), asyncHandler(ctrl.obtener));
router.post('/', logProceso('Agendar cita'), validar(v.crear), asyncHandler(ctrl.crear));
router.put('/:id', logProceso('Reprogramar cita'), validar(v.actualizar), asyncHandler(ctrl.actualizar));
router.patch('/:id/cancelar', logProceso('Cancelar cita'), validar(v.cancelar), asyncHandler(ctrl.cancelar));
router.delete('/:id', logProceso('Eliminar cita'), validar(v.eliminar), asyncHandler(ctrl.eliminar));

module.exports = router;
