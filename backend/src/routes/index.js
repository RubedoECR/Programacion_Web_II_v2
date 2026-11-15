const express = require('express');
const { verificarToken, soloMedico } = require('../middlewares/auth');

const router = express.Router();

router.use('/auth', require('./auth.routes'));

router.use(verificarToken);

router.use('/doctores', require('./doctores.routes'));
router.use('/citas', require('./citas.routes'));

router.use('/pacientes', soloMedico, require('./pacientes.routes'));
router.use('/consultas', soloMedico, require('./consultas.routes'));
router.use('/recetas', soloMedico, require('./recetas.routes'));
router.use('/medicamentos', soloMedico, require('./medicamentos.routes'));
router.use('/reportes', soloMedico, require('./reportes.routes'));

module.exports = router;
