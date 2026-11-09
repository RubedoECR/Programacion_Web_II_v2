// Rutas de consultas: /api/consultas
const express = require('express');
const ctrl = require('../controllers/consultas.controller');
const v = require('../validators/consultas.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', validar(v.listar), asyncHandler(ctrl.listar));
router.get('/:id', validar(v.obtener), asyncHandler(ctrl.obtener));
router.post('/', logProceso('Registrar consulta'), validar(v.crear), asyncHandler(ctrl.crear));
router.put('/:id', logProceso('Actualizar consulta'), validar(v.actualizar), asyncHandler(ctrl.actualizar));
router.delete('/:id', logProceso('Eliminar consulta'), validar(v.eliminar), asyncHandler(ctrl.eliminar));

module.exports = router;
