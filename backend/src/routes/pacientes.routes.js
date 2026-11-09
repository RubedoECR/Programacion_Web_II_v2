// Rutas de pacientes: /api/pacientes
const express = require('express');
const ctrl = require('../controllers/pacientes.controller');
const v = require('../validators/pacientes.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', validar(v.listar), asyncHandler(ctrl.listar));
router.get('/:id', validar(v.obtener), asyncHandler(ctrl.obtener)); // :id = _id o expediente
router.post('/', logProceso('Registrar paciente'), validar(v.crear), asyncHandler(ctrl.crear));
router.put('/:id', logProceso('Actualizar paciente'), validar(v.actualizar), asyncHandler(ctrl.actualizar));
router.delete('/:id', logProceso('Eliminar paciente'), validar(v.eliminar), asyncHandler(ctrl.eliminar));

module.exports = router;
