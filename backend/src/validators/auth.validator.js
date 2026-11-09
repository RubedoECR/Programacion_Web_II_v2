// Validaciones de backend para login y registro de médicos.
const { body } = require('express-validator');
const { telefonoValido, fechaNoFutura } = require('./comunes');

const FORMATO_PASSWORD = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,15}$/;
const MENSAJE_PASSWORD =
  'La contraseña debe tener de 8 a 15 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*)';

const login = [
  body('usuario').trim().notEmpty().withMessage('El usuario o correo es obligatorio'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

const registro = [
  // El frontend puede mandar "correo" o "email"
  body('email')
    .customSanitizer((v, { req }) => (v || req.body.correo || '').trim().toLowerCase())
    .notEmpty().withMessage('El correo es obligatorio')
    .bail()
    .isEmail().withMessage('El correo no es válido'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellidoP').optional({ values: 'falsy' }).trim(),
  body('apellidoM').optional({ values: 'falsy' }).trim(),
  body('especialidad').optional({ values: 'falsy' }).trim(),
  body('cedula').optional({ values: 'falsy' }).trim(),
  telefonoValido('telefono').optional({ values: 'falsy' }),
  fechaNoFutura('fechaNacimiento', 'La fecha de nacimiento').optional({ values: 'falsy' }),
  body('password').matches(FORMATO_PASSWORD).withMessage(MENSAJE_PASSWORD),
];

module.exports = { login, registro, FORMATO_PASSWORD, MENSAJE_PASSWORD };
