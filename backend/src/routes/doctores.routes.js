// Rutas de médicos: /api/doctores   (el alta es POST /api/auth/registro)
const express = require('express');
const ctrl = require('../controllers/doctores.controller');
const v = require('../validators/doctores.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', validar(v.obtener), asyncHandler(ctrl.obtener));
router.put('/:id', logProceso('Actualizar médico'), validar(v.actualizar), asyncHandler(ctrl.actualizar));
router.delete('/:id', logProceso('Eliminar médico'), validar(v.eliminar), asyncHandler(ctrl.eliminar));

module.exports = router;
