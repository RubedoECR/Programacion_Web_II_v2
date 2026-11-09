// Validaciones de backend para la tabla de consultas.
const { body, query } = require('express-validator');
const { idValido, aArreglo } = require('./comunes');

const numero = (campo, min, max, etiqueta) =>
  body(campo)
    .optional({ values: 'falsy' })
    .isFloat({ min, max })
    .withMessage(`${etiqueta} debe estar entre ${min} y ${max}`)
    .toFloat();

function reglas(esActualizacion) {
  const req = (cadena) => (esActualizacion ? cadena.optional() : cadena);

  return [
    req(body('paciente')).isMongoId().withMessage('Selecciona un paciente válido'),
    body('cita').optional({ values: 'falsy' }).isMongoId().withMessage('Cita no válida'),
    body('fecha').optional({ values: 'falsy' }).isISO8601().withMessage('Fecha no válida'),
    body('severidad').optional().isIn(['Leve', 'Moderado', 'Grave', 'Crítico']).withMessage('Severidad no válida'),
    body('presion')
      .optional({ values: 'falsy' })
      .matches(/^\d{2,3}\/\d{2,3}$/).withMessage('La presión debe tener formato 120/80'),
    numero('frecuencia', 20, 250, 'La frecuencia cardiaca'),
    numero('frecuenciaResp', 5, 80, 'La frecuencia respiratoria'),
    numero('saturacionO2', 50, 100, 'La saturación de oxígeno'),
    numero('temperatura', 30, 45, 'La temperatura'),
    numero('peso', 0.5, 400, 'El peso'),
    numero('talla', 30, 250, 'La talla'),
    body('diagnosticos').optional().customSanitizer(aArreglo),
    body('alergias').optional().customSanitizer(aArreglo),
    body('medicamentos').optional().isArray().withMessage('Los medicamentos deben ser una lista'),
    body('medicamentos.*.nombre').trim().notEmpty().withMessage('Cada medicamento necesita nombre'),
    // Al crear, debe haber al menos síntomas o un diagnóstico
    ...(esActualizacion
      ? []
      : [
          body('sintomas').custom((v, { req: r }) => {
            const hayDiagnostico = Array.isArray(r.body.diagnosticos) && r.body.diagnosticos.length > 0;
            if (!String(v || '').trim() && !hayDiagnostico) {
              throw new Error('Registra al menos los síntomas o un diagnóstico');
            }
            return true;
          }),
        ]),
  ];
}

const listar = [
  query('paciente').optional().isMongoId().withMessage('Paciente inválido'),
  query('medico').optional().isMongoId().withMessage('Médico inválido'),
];

module.exports = {
  listar,
  crear: reglas(false),
  actualizar: [idValido, ...reglas(true)],
  obtener: [idValido],
  eliminar: [idValido],
};
