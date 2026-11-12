// Validaciones de backend para el catálogo de medicamentos.
const c = require('./comunes');

const VIAS = ['Oral', 'Sublingual', 'Intramuscular', 'Intravenosa', 'Tópica', 'Inhalada', 'Otra'];

function revisar(datos, esNuevo) {
  const errores = [];
  if (esNuevo || datos.nombre !== undefined) {
    if (c.estaVacio(datos.nombre)) errores.push('El nombre del medicamento es obligatorio');
  }
  if (datos.via !== undefined && !VIAS.includes(datos.via)) errores.push('Vía de administración no válida');
  if (datos.activo !== undefined && typeof datos.activo !== 'boolean') errores.push('Activo debe ser verdadero o falso');
  return errores;
}

function crear(req) {
  return revisar(req.body, true);
}

function actualizar(req) {
  return c.idEnUrl(req).concat(revisar(req.body, false));
}

module.exports = { crear, actualizar, obtener: c.idEnUrl, eliminar: c.idEnUrl };
