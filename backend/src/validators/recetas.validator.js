const c = require('./comunes');

function revisarMedicamentos(medicamentos, errores) {
  if (medicamentos === undefined) return;
  if (!Array.isArray(medicamentos)) {
    errores.push('Los medicamentos deben ser una lista');
    return;
  }
  for (const med of medicamentos) {
    if (c.estaVacio(med.nombre)) errores.push('Cada medicamento necesita nombre');
  }
}

function crear(req) {
  const errores = [];
  if (!c.esId(req.body.consulta)) errores.push('La consulta no es válida');
  revisarMedicamentos(req.body.medicamentos, errores);
  return errores;
}

function actualizar(req) {
  const errores = c.idEnUrl(req);
  revisarMedicamentos(req.body.medicamentos, errores);
  if (req.body.indicaciones && req.body.indicaciones.length > 2000) errores.push('Las indicaciones son demasiado largas');
  return errores;
}

function listar(req) {
  const errores = [];
  if (req.query.paciente && !c.esId(req.query.paciente)) errores.push('Paciente inválido');
  return errores;
}

module.exports = { crear, actualizar, listar, obtener: c.idEnUrl, eliminar: c.idEnUrl };
