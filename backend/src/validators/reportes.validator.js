// Validaciones de los filtros de reportes (?desde=AAAA-MM-DD&hasta=AAAA-MM-DD)
const c = require('./comunes');

function rango(req) {
  const { desde, hasta } = req.query;
  const errores = [];
  if (desde && !c.esFecha(desde)) errores.push('"desde" debe tener formato AAAA-MM-DD');
  if (hasta && !c.esFecha(hasta)) errores.push('"hasta" debe tener formato AAAA-MM-DD');
  if (desde && hasta && desde > hasta) errores.push('"desde" no puede ser mayor que "hasta"');
  return errores;
}

module.exports = { rango };
