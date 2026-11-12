// Rutas de médicos: /api/doctores   (el alta es POST /api/auth/medico/registro)
const express = require('express');
const ctrl = require('../controllers/doctores.controller');
const v = require('../validators/doctores.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const { soloMedico } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ctrl.listar); // médicos y pacientes
router.get('/:id', soloMedico, validar(v.obtener), ctrl.obtener);
router.put('/:id', soloMedico, logProceso('Actualizar médico'), validar(v.actualizar), ctrl.actualizar);
router.delete('/:id', soloMedico, logProceso('Eliminar médico'), validar(v.eliminar), ctrl.eliminar);

module.exports = router;
