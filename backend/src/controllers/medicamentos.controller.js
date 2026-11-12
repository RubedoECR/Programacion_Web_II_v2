// Controlador del catálogo de medicamentos.
const Medicamento = require('../models/Medicamento');
const Receta = require('../models/Receta');

const CAMPOS = ['nombre', 'presentacion', 'concentracion', 'via', 'dosisSugerida', 'activo'];

function datosDelMedicamento(body) {
  const datos = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }
  return datos;
}

// GET /api/medicamentos?activos=true
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.activos === 'true') filtro.activo = true;
    const medicamentos = await Medicamento.find(filtro).sort({ nombre: 1 });
    res.json({ success: true, data: medicamentos });
  } catch (error) {
    next(error);
  }
}

// GET /api/medicamentos/:id
async function obtener(req, res, next) {
  try {
    const medicamento = await Medicamento.findById(req.params.id);
    if (!medicamento) {
      return res.status(404).json({ success: false, message: 'Medicamento no encontrado' });
    }
    res.json({ success: true, data: medicamento });
  } catch (error) {
    next(error);
  }
}

// POST /api/medicamentos
async function crear(req, res, next) {
  try {
    const existe = await Medicamento.findOne({ nombre: req.body.nombre.trim() });
    if (existe) {
      return res.status(409).json({ success: false, message: 'Ese medicamento ya está en el catálogo' });
    }
    const medicamento = await Medicamento.create(datosDelMedicamento(req.body));
    res.status(201).json({ success: true, message: 'Medicamento agregado al catálogo', data: medicamento });
  } catch (error) {
    next(error);
  }
}

// PUT /api/medicamentos/:id
async function actualizar(req, res, next) {
  try {
    const medicamento = await Medicamento.findByIdAndUpdate(req.params.id, datosDelMedicamento(req.body), {
      new: true,
      runValidators: true,
    });
    if (!medicamento) {
      return res.status(404).json({ success: false, message: 'Medicamento no encontrado' });
    }
    res.json({ success: true, message: 'Medicamento actualizado', data: medicamento });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/medicamentos/:id
async function eliminar(req, res, next) {
  try {
    const usado = await Receta.findOne({ 'medicamentos.medicamento': req.params.id });
    if (usado) {
      return res.status(409).json({
        success: false,
        message: 'El medicamento aparece en recetas; desactívalo en lugar de eliminarlo',
      });
    }

    const medicamento = await Medicamento.findByIdAndDelete(req.params.id);
    if (!medicamento) {
      return res.status(404).json({ success: false, message: 'Medicamento no encontrado' });
    }
    res.json({ success: true, message: 'Medicamento eliminado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
