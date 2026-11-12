// ROUTER DEL API: une las rutas de cada recurso bajo /api
//
//   /api/auth          → login y registro de médicos y pacientes (públicas) + perfil
//   /api/doctores      → médicos (colección usuarios)
//   /api/citas         → médicos y pacientes (cada ruta dice quién puede usarla)
//   /api/pacientes     → solo médicos
//   /api/consultas     → solo médicos
//   /api/recetas       → solo médicos
//   /api/medicamentos  → solo médicos
//   /api/reportes      → solo médicos
//
// Todo lo que está después de verificarToken exige el header  Authorization: Bearer <token>
const express = require('express');
const { verificarToken, soloMedico } = require('../middlewares/auth');

const router = express.Router();

// Rutas públicas
router.use('/auth', require('./auth.routes'));

// A partir de aquí todas las rutas requieren token
router.use(verificarToken);

router.use('/doctores', require('./doctores.routes'));
router.use('/citas', require('./citas.routes'));

router.use('/pacientes', soloMedico, require('./pacientes.routes'));
router.use('/consultas', soloMedico, require('./consultas.routes'));
router.use('/recetas', soloMedico, require('./recetas.routes'));
router.use('/medicamentos', soloMedico, require('./medicamentos.routes'));
router.use('/reportes', soloMedico, require('./reportes.routes'));

module.exports = router;
