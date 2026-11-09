// Validaciones de backend para la tabla de médicos (usuarios).
const { body } = require('express-validator');
const { idValido, telefonoValido } = require('./comunes');
const { FORMATO_PASSWORD, MENSAJE_PASSWORD } = require('./auth.validator');

const obtener = [idValido];

const actualizar = [
  idValido,
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede quedar vacío'),
  body('email').optional().trim().isEmail().withMessage('El correo no es válido').toLowerCase(),
  body('especialidad').optional().trim(),
  body('cedula').optional().trim(),
  telefonoValido('telefono').optional({ values: 'falsy' }),
  body('password').optional({ values: 'falsy' }).matches(FORMATO_PASSWORD).withMessage(MENSAJE_PASSWORD),
  body('rol').not().exists().withMessage('El rol no se puede modificar desde aquí'),
];

const eliminar = [idValido];

module.exports = { obtener, actualizar, eliminar };
