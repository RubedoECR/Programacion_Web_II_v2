// Validaciones de backend para la tabla de citas.
const c = require('./comunes');
const { HORARIOS, fechaDeHoy } = require('../utils/horarios');

function revisarFechaYHora(fecha, hora) {
  const errores = [];
  if (!c.esFecha(fecha)) errores.push('La fecha no es válida');
  else if (fecha < fechaDeHoy()) errores.push('No se pueden agendar citas en fechas pasadas');
  if (!HORARIOS.includes(hora)) errores.push('Elige uno de los horarios disponibles');
  return errores;
}

// GET /citas/disponibles?medico=&fecha=
function disponibles(req) {
  const errores = [];
  if (!c.esId(req.query.medico)) errores.push('Selecciona un médico');
  if (!c.esFecha(req.query.fecha)) errores.push('Selecciona una fecha válida');
  return errores;
}

// POST /citas
function crear(req) {
  const datos = req.body;
  let errores = [];

  if (!c.esId(datos.medico)) errores.push('Selecciona un médico');
  // Cuando agenda el médico debe indicar el paciente; cuando agenda el paciente se toma de su sesión
  if (req.usuario.rol === 'medico' && !c.esId(datos.paciente)) errores.push('Selecciona un paciente');
  errores = errores.concat(revisarFechaYHora(datos.fecha, datos.hora));
  if (datos.motivo && datos.motivo.length > 300) errores.push('El motivo es demasiado largo (máximo 300 caracteres)');

  return errores;
}

// PUT /citas/:id  (reprogramar)
function reprogramar(req) {
  const errores = c.idEnUrl(req);
  return errores.concat(revisarFechaYHora(req.body.fecha, req.body.hora));
}

// GET /citas?fecha=&medico=&paciente=&estado=
function listar(req) {
  const q = req.query;
  const errores = [];
  if (q.fecha && !c.esFecha(q.fecha)) errores.push('Fecha inválida');
  if (q.medico && !c.esId(q.medico)) errores.push('Médico inválido');
  if (q.paciente && !c.esId(q.paciente)) errores.push('Paciente inválido');
  if (q.estado && !['Confirmada', 'Atendida', 'Cancelada'].includes(q.estado)) errores.push('Estado inválido');
  return errores;
}

module.exports = { disponibles, crear, reprogramar, listar, obtener: c.idEnUrl, cancelar: c.idEnUrl, eliminar: c.idEnUrl };
