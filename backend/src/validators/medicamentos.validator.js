// Validaciones de backend para el catálogo de medicamentos.
const { body } = require('express-validator');
const { idValido } = require('./comunes');

const VIAS = ['Oral', 'Sublingual', 'Intramuscular', 'Intravenosa', 'Tópica', 'Inhalada', 'Otra'];

function reglas(esActualizacion) {
  const req = (cadena) => (esActualizacion ? cadena.optional() : cadena);
  return [
    req(body('nombre')).trim().notEmpty().withMessage('El nombre del medicamento es obligatorio'),
    body('presentacion').optional().trim(),
    body('concentracion').optional().trim(),
    body('via').optional().isIn(VIAS).withMessage('Vía de administración no válida'),
    body('dosisSugerida').optional().trim(),
    body('activo').optional().isBoolean().withMessage('Activo debe ser verdadero o falso').toBoolean(),
  ];
}

module.exports = {
  crear: reglas(false),
  actualizar: [idValido, ...reglas(true)],
  obtener: [idValido],
  eliminar: [idValido],
};
