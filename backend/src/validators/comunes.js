// Reglas reutilizables por varios validadores.
const { param, body } = require('express-validator');

const idValido = param('id').isMongoId().withMessage('El ID no es válido');

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Teléfono con al menos 10 dígitos (acepta espacios, guiones, paréntesis)
const telefonoValido = (campo) =>
  body(campo)
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v))
    .custom((v) => String(v).replace(/\D/g, '').length >= 10)
    .withMessage('El teléfono debe tener al menos 10 dígitos');

// Fecha AAAA-MM-DD que no sea futura
const fechaNoFutura = (campo, etiqueta) =>
  body(campo)
    .isISO8601({ strict: true })
    .withMessage(`${etiqueta} no es una fecha válida`)
    .bail()
    .custom((v) => String(v).slice(0, 10) <= hoyISO())
    .withMessage(`${etiqueta} no puede ser futura`);

// Convierte "a, b, c" o ["a","b"] en arreglo limpio
const aArreglo = (v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
};

module.exports = { idValido, telefonoValido, fechaNoFutura, aArreglo, hoyISO };
