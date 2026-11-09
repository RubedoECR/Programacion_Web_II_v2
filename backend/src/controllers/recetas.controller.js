// Controlador de recetas médicas.
const Receta = require('../models/Receta');
const Consulta = require('../models/Consulta');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');

const POPULATE = [
  { path: 'paciente', select: 'expediente nombre apellidoP apellidoM fechaNacimiento sexo alergias' },
  { path: 'medico', select: 'nombre apellidoP apellidoM especialidad cedula telefono email' },
  { path: 'consulta' },
];

function verificarAutor(req, receta) {
  if (req.usuario.rol !== 'admin' && String(receta.medico._id || receta.medico) !== req.usuario.id) {
    throw new ErrorApi(403, 'Solo el médico que emitió la receta puede modificarla');
  }
}

// GET /api/recetas?paciente=
async function listar(req, res) {
  const filtro = elegir(req.query, ['paciente']);
  const recetas = await Receta.find(filtro)
    .populate([POPULATE[0], POPULATE[1]])
    .sort({ fecha: -1 });
  res.json({ success: true, data: recetas });
}

// GET /api/recetas/:id
async function obtener(req, res) {
  const receta = await Receta.findById(req.params.id).populate(POPULATE);
  if (!receta) throw new ErrorApi(404, 'Receta no encontrada');
  res.json({ success: true, data: receta });
}

// POST /api/recetas  (para consultas que no tengan receta)
async function crear(req, res) {
  const consulta = await Consulta.findById(req.body.consulta);
  if (!consulta) throw new ErrorApi(404, 'Consulta no encontrada');
  if (await Receta.exists({ consulta: consulta._id })) throw new ErrorApi(409, 'Esa consulta ya tiene receta');

  const receta = await Receta.create({
    consulta: consulta._id,
    paciente: consulta.paciente,
    medico: req.usuario.id,
    medicamentos: req.body.medicamentos || [],
    indicaciones: req.body.indicaciones || '',
  });
  await receta.populate(POPULATE);
  res.status(201).json({ success: true, message: 'Receta creada', data: receta });
}

// PUT /api/recetas/:id
async function actualizar(req, res) {
  const receta = await Receta.findById(req.params.id);
  if (!receta) throw new ErrorApi(404, 'Receta no encontrada');
  verificarAutor(req, receta);

  Object.assign(receta, elegir(req.body, ['medicamentos', 'indicaciones']));
  await receta.save();
  await receta.populate(POPULATE);
  res.json({ success: true, message: 'Receta actualizada', data: receta });
}

// DELETE /api/recetas/:id
async function eliminar(req, res) {
  const receta = await Receta.findById(req.params.id);
  if (!receta) throw new ErrorApi(404, 'Receta no encontrada');
  verificarAutor(req, receta);

  await receta.deleteOne();
  res.json({ success: true, message: 'Receta eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
