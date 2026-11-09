// Controlador de autenticación: login, registro de médico y perfil del médico en sesión.
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');
const logger = require('../utils/logger');

const CAMPOS_REGISTRO = ['nombre', 'apellidoP', 'apellidoM', 'email', 'especialidad', 'cedula', 'telefono', 'fechaNacimiento', 'password'];

function generarToken(usuario) {
  return jwt.sign({ id: String(usuario._id), rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// POST /api/auth/login
async function login(req, res) {
  const usuarioIngresado = req.body.usuario.trim();
  const usuario = await Usuario.findOne({
    $or: [{ email: usuarioIngresado.toLowerCase() }, { usuario: usuarioIngresado }],
  }).select('+password');

  // Mismo mensaje en ambos casos para no revelar qué usuarios existen
  const credencialesValidas = usuario && usuario.activo && (await usuario.compararPassword(req.body.password));
  if (!credencialesValidas) {
    logger.warn('Intento de login fallido', { usuario: usuarioIngresado });
    throw new ErrorApi(401, 'Usuario o contraseña incorrectos');
  }

  logger.info('Inicio de sesión', { usuario: String(usuario._id) });
  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: { token: generarToken(usuario), usuario: usuario.toJSON() },
  });
}

// POST /api/auth/registro
async function registro(req, res) {
  const datos = elegir(req.body, CAMPOS_REGISTRO);
  datos.usuario = datos.email;

  const existe = await Usuario.exists({ email: datos.email });
  if (existe) throw new ErrorApi(409, 'Ese correo ya está registrado');

  const usuario = await Usuario.create(datos);
  res.status(201).json({ success: true, message: 'Médico registrado exitosamente', data: usuario.toJSON() });
}

// GET /api/auth/perfil
async function perfil(req, res) {
  const usuario = await Usuario.findById(req.usuario.id);
  if (!usuario) throw new ErrorApi(404, 'Usuario no encontrado');
  res.json({ success: true, data: usuario });
}

module.exports = { login, registro, perfil };
