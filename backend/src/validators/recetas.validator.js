// Validaciones de backend para la tabla de recetas.
const { body, query } = require('express-validator');
const { idValido } = require('./comunes');

const renglones = [
  body('medicamentos').optional().isArray().withMessage('Los medicamentos deben ser una lista'),
  body('medicamentos.*.nombre').trim().notEmpty().withMessage('Cada medicamento necesita nombre'),
  body('medicamentos.*.medicamento').optional({ values: 'falsy' }).isMongoId().withMessage('Medicamento de catálogo no válido'),
  body('medicamentos.*.dosis').optional().trim(),
  body('indicaciones').optional().trim().isLength({ max: 2000 }).withMessage('Las indicaciones son demasiado largas'),
];

module.exports = {
  listar: [query('paciente').optional().isMongoId().withMessage('Paciente inválido')],
  crear: [body('consulta').isMongoId().withMessage('Consulta no válida'), ...renglones],
  actualizar: [idValido, ...renglones],
  obtener: [idValido],
  eliminar: [idValido],
};
