// Controlador de autenticación: login y registro de médicos y de pacientes.
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const logger = require('../utils/logger');
const { datosDelPaciente, siguienteExpediente } = require('./pacientes.controller');

function generarToken(id, rol) {
  return jwt.sign({ id: String(id), rol: rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// POST /api/auth/medico/login
async function loginMedico(req, res, next) {
  try {
    const correo = req.body.correo.trim().toLowerCase();
    const medico = await Usuario.findOne({ email: correo });

    // Mismo mensaje en todos los casos para no revelar qué correos existen
    if (!medico || medico.password !== req.body.password || medico.activo === false) {
      logger.warn('Login de médico fallido', { correo: correo });
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    logger.info('Inicio de sesión de médico', { id: String(medico._id) });
    res.json({
      success: true,
      message: 'Bienvenido',
      data: { token: generarToken(medico._id, 'medico'), rol: 'medico', usuario: medico },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/paciente/login
async function loginPaciente(req, res, next) {
  try {
    const correo = req.body.correo.trim().toLowerCase();
    const paciente = await Paciente.findOne({ correo: correo });

    if (!paciente || paciente.password !== req.body.password) {
      logger.warn('Login de paciente fallido', { correo: correo });
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }
    if (paciente.estado === 'Inactivo') {
      return res.status(403).json({ success: false, message: 'Tu cuenta está inactiva, comunícate con la clínica' });
    }

    logger.info('Inicio de sesión de paciente', { id: String(paciente._id) });
    res.json({
      success: true,
      message: 'Bienvenido',
      data: { token: generarToken(paciente._id, 'paciente'), rol: 'paciente', usuario: paciente },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/medico/registro
async function registroMedico(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();

    const existe = await Usuario.findOne({ email: email });
    if (existe) {
      return res.status(409).json({ success: false, message: 'Ese correo ya está registrado' });
    }

    const medico = await Usuario.create({
      nombre: req.body.nombre,
      apellidoP: req.body.apellidoP,
      apellidoM: req.body.apellidoM,
      email: email,
      password: req.body.password,
      especialidad: req.body.especialidad,
      cedula: req.body.cedula,
      telefono: req.body.telefono,
      fechaNacimiento: req.body.fechaNacimiento,
    });

    res.status(201).json({ success: true, message: 'Médico registrado exitosamente', data: medico });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/paciente/registro
async function registroPaciente(req, res, next) {
  try {
    const correo = req.body.correo.trim().toLowerCase();

    const existe = await Paciente.findOne({ correo: correo });
    if (existe) {
      return res.status(409).json({ success: false, message: 'Ese correo ya está registrado' });
    }

    const datos = datosDelPaciente(req.body);
    datos.correo = correo;
    datos.password = req.body.password;
    datos.expediente = await siguienteExpediente();

    const paciente = await Paciente.create(datos);
    res.status(201).json({ success: true, message: 'Cuenta creada exitosamente', data: paciente });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/perfil  → datos del usuario en sesión (médico o paciente)
async function perfil(req, res, next) {
  try {
    let usuario;
    if (req.usuario.rol === 'medico') {
      usuario = await Usuario.findById(req.usuario.id);
    } else {
      usuario = await Paciente.findById(req.usuario.id);
    }
    res.json({ success: true, data: { rol: req.usuario.rol, usuario: usuario } });
  } catch (error) {
    next(error);
  }
}

module.exports = { loginMedico, loginPaciente, registroMedico, registroPaciente, perfil };
