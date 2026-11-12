// Rutas de citas: /api/citas
const express = require('express');
const ctrl = require('../controllers/citas.controller');
const v = require('../validators/citas.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const { soloMedico, soloPaciente } = require('../middlewares/auth');

const router = express.Router();

// Médicos y pacientes
router.get('/disponibles', validar(v.disponibles), ctrl.disponibles);
router.post('/', logProceso('Agendar cita'), validar(v.crear), ctrl.crear);
router.patch('/:id/cancelar', logProceso('Cancelar cita'), validar(v.cancelar), ctrl.cancelar);

// Solo pacientes
router.get('/mias', soloPaciente, ctrl.mias);

// Solo médicos
router.get('/', soloMedico, validar(v.listar), ctrl.listar);
router.get('/:id', soloMedico, validar(v.obtener), ctrl.obtener);
router.put('/:id', soloMedico, logProceso('Reprogramar cita'), validar(v.reprogramar), ctrl.reprogramar);
router.delete('/:id', soloMedico, logProceso('Eliminar cita'), validar(v.eliminar), ctrl.eliminar);

module.exports = router;
