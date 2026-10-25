// Middlewares de validación y utilidades de petición

const validarLogin = (req, res, next) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña requeridos'
    });
  }
  next();
};

const validarRegistroMedico = (req, res, next) => {
  const { nombre, password } = req.body;
  const nombreFinal = (nombre || '').trim();

  if (!nombreFinal || !password) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos (nombre y contraseña son obligatorios)'
    });
  }
  next();
};

const validarRegistroPaciente = (req, res, next) => {
  const { nombre, apellidoP, fechaNacimiento, sexo, telefono } = req.body;
  const nombreLimpio = (nombre || '').trim();
  const apellidoPLimpio = (apellidoP || '').trim();
  const telefonoLimpio = (telefono || '').trim();

  if (!nombreLimpio || !apellidoPLimpio || !fechaNacimiento || !sexo || !telefonoLimpio) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos (nombre, apellidoP, fechaNacimiento, sexo y teléfono son obligatorios)'
    });
  }

  const numDigits = telefonoLimpio.replace(/\D/g, '');
  if (numDigits.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'El teléfono debe contener al menos 10 dígitos'
    });
  }

  next();
};

const validarConsulta = (req, res, next) => {
  const { pacienteId, medico } = req.body;
  if (!pacienteId || !medico) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos'
    });
  }
  next();
};

const validarCita = (req, res, next) => {
  const { nombre, fecha, hora } = req.body;
  if (!nombre || !fecha || !hora) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, fecha y hora son obligatorios para agendar la cita'
    });
  }
  next();
};

// Middleware para manejo de errores en rutas asíncronas
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  validarLogin,
  validarRegistroMedico,
  validarRegistroPaciente,
  validarConsulta,
  validarCita,
  asyncHandler
};
