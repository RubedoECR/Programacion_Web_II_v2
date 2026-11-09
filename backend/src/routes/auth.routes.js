// Rutas de autenticación: /api/auth
const express = require('express');
const ctrl = require('../controllers/auth.controller');
const v = require('../validators/auth.validator');
const validar = require('../middlewares/validar');
const logProceso = require('../middlewares/logProceso');
const { verificarToken } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', validar(v.login), asyncHandler(ctrl.login));                                       // público
router.post('/registro', logProceso('Registro de médico'), validar(v.registro), asyncHandler(ctrl.registro)); // público
router.get('/perfil', verificarToken, asyncHandler(ctrl.perfil));

module.exports = router;
