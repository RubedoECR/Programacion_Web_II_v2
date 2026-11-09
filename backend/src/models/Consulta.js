// Modelo: Consulta médica. Colección "consultas".
const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: [true, 'El paciente es obligatorio'] },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: [true, 'El médico es obligatorio'] },
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', default: null },

    fecha: { type: Date, default: Date.now },
    tipoConsulta: { type: String, trim: true, default: 'Consulta general' },
    categoria: { type: String, trim: true, default: 'General' },
    severidad: { type: String, enum: ['Leve', 'Moderado', 'Grave', 'Crítico'], default: 'Leve' },

    // Signos vitales
    presion: { type: String, trim: true, default: '' },
    frecuencia: { type: Number, min: 20, max: 250 },
    frecuenciaResp: { type: Number, min: 5, max: 80 },
    saturacionO2: { type: Number, min: 50, max: 100 },
    temperatura: { type: Number, min: 30, max: 45 },
    peso: { type: Number, min: 0.5, max: 400 },
    talla: { type: Number, min: 30, max: 250 },
    imc: { type: Number },

    sintomas: { type: String, trim: true, default: '' },
    diagnosticos: { type: [String], default: [] },
    alergias: { type: [String], default: [] },
    notas: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

// Permite hacer .populate('receta') para saber qué receta generó la consulta
consultaSchema.virtual('receta', {
  ref: 'Receta',
  localField: '_id',
  foreignField: 'consulta',
  justOne: true,
});

consultaSchema.index({ paciente: 1, fecha: -1 });

module.exports = mongoose.model('Consulta', consultaSchema, 'consultas');
