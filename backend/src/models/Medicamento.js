// Modelo: Medicamento (catálogo para recetar). Colección "medicamentos".
const mongoose = require('mongoose');

const medicamentoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], unique: true, trim: true },
    presentacion: { type: String, trim: true, default: '' }, // Tabletas, jarabe, ampolleta...
    concentracion: { type: String, trim: true, default: '' }, // 500 mg, 20 mg/ml...
    via: { type: String, enum: ['Oral', 'Sublingual', 'Intramuscular', 'Intravenosa', 'Tópica', 'Inhalada', 'Otra'], default: 'Oral' },
    dosisSugerida: { type: String, trim: true, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicamento', medicamentoSchema, 'medicamentos');
