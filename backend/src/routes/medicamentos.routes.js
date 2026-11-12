// Rutas del catálogo de medicamentos: /api/medicamentos
const express = require('express');
const ctrl = require('../controllers/medicamentos.controller');
const v = require('../validators/medicamentos.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');

const router = express.Router();

router.get('/', ctrl.listar);
router.get('/:id', validar(v.obtener), ctrl.obtener);
router.post('/', logProceso('Agregar medicamento'), validar(v.crear), ctrl.crear);
router.put('/:id', logProceso('Actualizar medicamento'), validar(v.actualizar), ctrl.actualizar);
router.delete('/:id', logProceso('Eliminar medicamento'), validar(v.eliminar), ctrl.eliminar);

module.exports = router;
