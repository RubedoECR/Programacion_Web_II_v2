// Rutas de consultas: /api/consultas
const express = require('express');
const ctrl = require('../controllers/consultas.controller');
const v = require('../validators/consultas.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');

const router = express.Router();

router.get('/', validar(v.listar), ctrl.listar);
router.get('/:id', validar(v.obtener), ctrl.obtener);
router.post('/', logProceso('Registrar consulta'), validar(v.crear), ctrl.crear);
router.put('/:id', logProceso('Actualizar consulta'), validar(v.actualizar), ctrl.actualizar);
router.delete('/:id', logProceso('Eliminar consulta'), validar(v.eliminar), ctrl.eliminar);

module.exports = router;
