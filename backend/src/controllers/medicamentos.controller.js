// Controlador del catálogo de medicamentos.
const Medicamento = require('../models/Medicamento');
const Receta = require('../models/Receta');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');

const CAMPOS = ['nombre', 'presentacion', 'concentracion', 'via', 'dosisSugerida', 'activo'];

// GET /api/medicamentos?activos=true
async function listar(req, res) {
  const filtro = req.query.activos === 'true' ? { activo: true } : {};
  const medicamentos = await Medicamento.find(filtro).sort({ nombre: 1 });
  res.json({ success: true, data: medicamentos });
}

// GET /api/medicamentos/:id
async function obtener(req, res) {
  const medicamento = await Medicamento.findById(req.params.id);
  if (!medicamento) throw new ErrorApi(404, 'Medicamento no encontrado');
  res.json({ success: true, data: medicamento });
}

// POST /api/medicamentos
async function crear(req, res) {
  const medicamento = await Medicamento.create(elegir(req.body, CAMPOS));
  res.status(201).json({ success: true, message: 'Medicamento agregado al catálogo', data: medicamento });
}

// PUT /api/medicamentos/:id
async function actualizar(req, res) {
  const medicamento = await Medicamento.findByIdAndUpdate(req.params.id, elegir(req.body, CAMPOS), {
    new: true,
    runValidators: true,
  });
  if (!medicamento) throw new ErrorApi(404, 'Medicamento no encontrado');
  res.json({ success: true, message: 'Medicamento actualizado', data: medicamento });
}

// DELETE /api/medicamentos/:id
async function eliminar(req, res) {
  if (await Receta.exists({ 'medicamentos.medicamento': req.params.id })) {
    throw new ErrorApi(409, 'El medicamento aparece en recetas; desactívalo en lugar de eliminarlo');
  }
  const borrado = await Medicamento.findByIdAndDelete(req.params.id);
  if (!borrado) throw new ErrorApi(404, 'Medicamento no encontrado');
  res.json({ success: true, message: 'Medicamento eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
