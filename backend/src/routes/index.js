// ROUTER DEL API: une las rutas de cada recurso bajo /api
//
//   /api/auth          → login y registro (públicas) + perfil
//   /api/doctores      → médicos (colección usuarios)
//   /api/pacientes
//   /api/citas
//   /api/consultas
//   /api/recetas
//   /api/medicamentos
//   /api/reportes
//
// Todo lo que está después de verificarToken exige el header  Authorization: Bearer <token>
const express = require('express');
const { verificarToken } = require('../middlewares/auth');

const router = express.Router();

// Rutas públicas (login y registro) + perfil protegido dentro del mismo archivo
router.use('/auth', require('./auth.routes'));

// A partir de aquí, todas las rutas requieren token
router.use(verificarToken);

router.use('/doctores', require('./doctores.routes'));
router.use('/pacientes', require('./pacientes.routes'));
router.use('/citas', require('./citas.routes'));
router.use('/consultas', require('./consultas.routes'));
router.use('/recetas', require('./recetas.routes'));
router.use('/medicamentos', require('./medicamentos.routes'));
router.use('/reportes', require('./reportes.routes'));

module.exports = router;
