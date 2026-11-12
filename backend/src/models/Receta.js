// Modelo: Receta médica. Colección "recetas". Cada consulta genera una receta.
const mongoose = require('mongoose');

const recetaSchema = new mongoose.Schema(
  {
    consulta: { type: mongoose.Schema.Types.ObjectId, ref: 'Consulta', required: true },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    folio: { type: String },
    fecha: { type: Date, default: Date.now },
    medicamentos: [
      {
        _id: false,
        medicamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicamento', default: null }, // si viene del catálogo
        nombre: { type: String, required: [true, 'El nombre del medicamento es obligatorio'], trim: true },
        dosis: { type: String, trim: true, default: '' },
      },
    ],
    indicaciones: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receta', recetaSchema, 'recetas');
