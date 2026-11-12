// Rutas de pacientes: /api/pacientes  (solo médicos; el alta la hace el paciente en /api/auth/paciente/registro)
const express = require('express');
const ctrl = require('../controllers/pacientes.controller');
const v = require('../validators/pacientes.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');

const router = express.Router();

router.get('/', ctrl.listar);
router.get('/:id', validar(v.obtener), ctrl.obtener); // :id = _id o expediente
router.put('/:id', logProceso('Actualizar paciente'), validar(v.actualizar), ctrl.actualizar);
router.delete('/:id', logProceso('Eliminar paciente'), validar(v.eliminar), ctrl.eliminar);

module.exports = router;
