// Validaciones de los filtros de reportes (?desde=AAAA-MM-DD&hasta=AAAA-MM-DD)
const { query } = require('express-validator');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const rango = [
  query('desde').optional({ values: 'falsy' }).matches(FECHA).withMessage('"desde" debe tener formato AAAA-MM-DD'),
  query('hasta').optional({ values: 'falsy' }).matches(FECHA).withMessage('"hasta" debe tener formato AAAA-MM-DD'),
  query('hasta')
    .optional({ values: 'falsy' })
    .custom((hasta, { req }) => !req.query.desde || req.query.desde <= hasta)
    .withMessage('"desde" no puede ser mayor que "hasta"'),
];

module.exports = { rango };
