// Validaciones de backend para la tabla de citas.
const { body, query } = require('express-validator');
const { idValido, telefonoValido, hoyISO } = require('./comunes');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function reglas(esActualizacion) {
  const req = (cadena) => (esActualizacion ? cadena.optional() : cadena);

  return [
    body('paciente').optional({ values: 'falsy' }).isMongoId().withMessage('Paciente no válido'),
    // Si no se elige un paciente registrado, hay que escribir el nombre
    body('nombre')
      .optional({ values: esActualizacion ? 'undefined' : 'falsy' })
      .trim()
      .notEmpty()
      .withMessage('El nombre del paciente es obligatorio'),
    ...(esActualizacion
      ? []
      : [
          body('nombre').custom((v, { req: r }) => {
            if (!r.body.paciente && !String(v || '').trim()) throw new Error('Elige un paciente o escribe su nombre');
            return true;
          }),
        ]),
    telefonoValido('telefono').optional({ values: 'falsy' }),
    body('correo').optional({ values: 'falsy' }).trim().isEmail().withMessage('El correo no es válido'),
    req(body('medico')).isMongoId().withMessage('Selecciona un médico válido'),
    req(body('fecha'))
      .matches(FECHA).withMessage('La fecha debe tener formato AAAA-MM-DD')
      .bail()
      .custom((v) => v >= hoyISO()).withMessage('No se pueden agendar citas en fechas pasadas'),
    req(body('hora')).matches(HORA).withMessage('La hora debe tener formato HH:mm'),
    body('duracionMinutos').optional().isInt({ min: 10, max: 240 }).withMessage('La duración debe ser de 10 a 240 minutos').toInt(),
    body('motivo').optional().trim().isLength({ max: 500 }).withMessage('El motivo es demasiado largo'),
    body('estado').optional().isIn(['Confirmada', 'Atendida', 'Cancelada']).withMessage('Estado no válido'),
  ];
}

const listar = [
  query('fecha').optional().matches(FECHA).withMessage('Fecha inválida'),
  query('medico').optional().isMongoId().withMessage('Médico inválido'),
  query('paciente').optional().isMongoId().withMessage('Paciente inválido'),
  query('estado').optional().isIn(['Confirmada', 'Atendida', 'Cancelada']).withMessage('Estado inválido'),
];

module.exports = {
  listar,
  crear: reglas(false),
  actualizar: [idValido, ...reglas(true)],
  obtener: [idValido],
  cancelar: [idValido],
  eliminar: [idValido],
};
