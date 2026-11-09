// Rutas de recetas: /api/recetas
const express = require('express');
const ctrl = require('../controllers/recetas.controller');
const v = require('../validators/recetas.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', validar(v.listar), asyncHandler(ctrl.listar));
router.get('/:id', validar(v.obtener), asyncHandler(ctrl.obtener));
router.post('/', logProceso('Crear receta'), validar(v.crear), asyncHandler(ctrl.crear));
router.put('/:id', logProceso('Actualizar receta'), validar(v.actualizar), asyncHandler(ctrl.actualizar));
router.delete('/:id', logProceso('Eliminar receta'), validar(v.eliminar), asyncHandler(ctrl.eliminar));

module.exports = router;
