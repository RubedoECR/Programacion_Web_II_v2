// Middlewares de autenticación.
//  - verificarToken: revisa el header  Authorization: Bearer <token>
//  - soloMedico / soloPaciente: dejan pasar solo a un tipo de usuario
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const logger = require('../utils/logger');

async function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de autorización requerido' });
  }

  let datos;
  try {
    datos = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn('Token rechazado', { ruta: req.originalUrl, motivo: error.message });
    return res.status(401).json({ success: false, message: 'Tu sesión expiró o no es válida, inicia sesión de nuevo' });
  }

  // El usuario del token debe seguir existiendo
  let usuario = null;
  try {
    if (datos.rol === 'medico') {
      usuario = await Usuario.findById(datos.id);
    } else if (datos.rol === 'paciente') {
      usuario = await Paciente.findById(datos.id);
    }
  } catch (error) {
    return next(error);
  }

  if (!usuario) {
    return res.status(401).json({ success: false, message: 'La sesión ya no es válida' });
  }

  req.usuario = { id: String(usuario._id), rol: datos.rol, nombre: usuario.nombre };
  next();
}

function soloMedico(req, res, next) {
  if (req.usuario.rol !== 'medico') {
    return res.status(403).json({ success: false, message: 'Esta sección es solo para médicos' });
  }
  next();
}

function soloPaciente(req, res, next) {
  if (req.usuario.rol !== 'paciente') {
    return res.status(403).json({ success: false, message: 'Esta sección es solo para pacientes' });
  }
  next();
}

module.exports = { verificarToken, soloMedico, soloPaciente };
