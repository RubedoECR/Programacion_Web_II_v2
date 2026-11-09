// Validaciones de backend para la tabla de pacientes.
const { body, param, query } = require('express-validator');
const { telefonoValido, fechaNoFutura, aArreglo, idValido } = require('./comunes');

const SEXOS = ['Masculino', 'Femenino', 'Otro'];
const TIPOS_SANGRE = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Las mismas reglas sirven para crear (todo obligatorio) y actualizar (todo opcional)
function reglas(esActualizacion) {
  const req = (cadena) => (esActualizacion ? cadena.optional() : cadena);

  return [
    req(body('nombre')).trim().notEmpty().withMessage('El nombre es obligatorio'),
    req(body('apellidoP')).trim().notEmpty().withMessage('El apellido paterno es obligatorio'),
    body('apellidoM').optional({ values: 'falsy' }).trim(),
    req(fechaNoFutura('fechaNacimiento', 'La fecha de nacimiento')),
    req(body('sexo')).isIn(SEXOS).withMessage('Selecciona un sexo válido'),
    req(telefonoValido('telefono')),
    body('correo').optional({ values: 'falsy' }).trim().isEmail().withMessage('El correo no es válido'),
    body('tipoSangre').optional().isIn(TIPOS_SANGRE).withMessage('Tipo de sangre no válido'),
    body('direccion').optional().trim(),
    body('alergias').optional().customSanitizer(aArreglo),
    telefonoValido('contactoTelefono').optional({ values: 'falsy' }),
    body('estado').optional().isIn(['Activo', 'Inactivo']).withMessage('Estado no válido'),
  ];
}

// GET /pacientes/:id acepta el _id de Mongo o el expediente (EXP-000001)
const obtener = [
  param('id')
    .custom((v) => /^[a-f\d]{24}$/i.test(v) || /^EXP-\d{6}$/.test(v))
    .withMessage('Usa el ID o el número de expediente (EXP-000001)'),
];

const listar = [
  query('estado').optional().isIn(['Activo', 'Inactivo']).withMessage('Estado no válido'),
  query('buscar').optional().isString().trim().isLength({ max: 60 }).withMessage('Búsqueda demasiado larga'),
];

module.exports = {
  listar,
  crear: reglas(false),
  actualizar: [idValido, ...reglas(true)],
  obtener,
  eliminar: [idValido],
};
