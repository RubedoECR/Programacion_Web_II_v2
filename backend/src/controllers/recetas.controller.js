// Controlador de recetas médicas.
const Receta = require('../models/Receta');
const Consulta = require('../models/Consulta');

const DATOS_PACIENTE = 'expediente nombre apellidoP apellidoM fechaNacimiento sexo alergias';
const DATOS_MEDICO = 'nombre apellidoP apellidoM especialidad cedula telefono email';

// GET /api/recetas?paciente=
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.paciente) filtro.paciente = req.query.paciente;

    const recetas = await Receta.find(filtro)
      .populate('paciente', DATOS_PACIENTE)
      .populate('medico', DATOS_MEDICO)
      .sort({ fecha: -1 });
    res.json({ success: true, data: recetas });
  } catch (error) {
    next(error);
  }
}

// GET /api/recetas/:id
async function obtener(req, res, next) {
  try {
    const receta = await Receta.findById(req.params.id)
      .populate('paciente', DATOS_PACIENTE)
      .populate('medico', DATOS_MEDICO)
      .populate('consulta');
    if (!receta) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }
    res.json({ success: true, data: receta });
  } catch (error) {
    next(error);
  }
}

// POST /api/recetas   (para una consulta que se quedó sin receta)
async function crear(req, res, next) {
  try {
    const consulta = await Consulta.findById(req.body.consulta);
    if (!consulta) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }
    const yaTiene = await Receta.findOne({ consulta: consulta._id });
    if (yaTiene) {
      return res.status(409).json({ success: false, message: 'Esa consulta ya tiene receta' });
    }

    const receta = await Receta.create({
      consulta: consulta._id,
      paciente: consulta.paciente,
      medico: req.usuario.id,
      folio: 'REC-' + String(consulta._id).slice(-6).toUpperCase(),
      medicamentos: req.body.medicamentos || [],
      indicaciones: req.body.indicaciones || '',
    });
    res.status(201).json({ success: true, message: 'Receta creada', data: receta });
  } catch (error) {
    next(error);
  }
}

// PUT /api/recetas/:id   (medicamentos e indicaciones)
async function actualizar(req, res, next) {
  try {
    const receta = await Receta.findById(req.params.id);
    if (!receta) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    if (req.body.medicamentos !== undefined) receta.medicamentos = req.body.medicamentos;
    if (req.body.indicaciones !== undefined) receta.indicaciones = req.body.indicaciones;
    await receta.save();
    res.json({ success: true, message: 'Receta actualizada', data: receta });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/recetas/:id
async function eliminar(req, res, next) {
  try {
    const receta = await Receta.findByIdAndDelete(req.params.id);
    if (!receta) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }
    res.json({ success: true, message: 'Receta eliminada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
