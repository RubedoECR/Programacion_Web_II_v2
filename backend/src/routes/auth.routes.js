// Rutas de autenticación: /api/auth
const express = require('express');
const ctrl = require('../controllers/auth.controller');
const v = require('../validators/auth.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const { verificarToken } = require('../middlewares/auth');

const router = express.Router();

// Públicas
router.post('/medico/login', validar(v.login), ctrl.loginMedico);
router.post('/medico/registro', logProceso('Registro de médico'), validar(v.registroMedico), ctrl.registroMedico);
router.post('/paciente/login', validar(v.login), ctrl.loginPaciente);
router.post('/paciente/registro', logProceso('Registro de paciente'), validar(v.registroPaciente), ctrl.registroPaciente);

// Con sesión
router.get('/perfil', verificarToken, ctrl.perfil);

module.exports = router;
