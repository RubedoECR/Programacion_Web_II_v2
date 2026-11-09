// Modelo: Receta médica. Colección "recetas". Cada consulta genera una receta.
const mongoose = require('mongoose');

const renglonSchema = new mongoose.Schema(
  {
    medicamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicamento', default: null }, // si viene del catálogo
    nombre: { type: String, required: [true, 'El nombre del medicamento es obligatorio'], trim: true },
    dosis: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const recetaSchema = new mongoose.Schema(
  {
    consulta: { type: mongoose.Schema.Types.ObjectId, ref: 'Consulta', required: true, unique: true },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    folio: { type: String, unique: true },
    fecha: { type: Date, default: Date.now },
    medicamentos: { type: [renglonSchema], default: [] },
    indicaciones: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

// Folio legible, ej. REC-20261108-4F2A
recetaSchema.pre('save', function () {
  if (this.folio) return;
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  this.folio = `REC-${fecha}-${String(this._id).slice(-4).toUpperCase()}`;
});

module.exports = mongoose.model('Receta', recetaSchema, 'recetas');
