// Modelo: Cita médica. Colección "citas".
const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    // Paciente registrado (opcional: se puede agendar a alguien que aún no tiene expediente)
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', default: null },
    nombre: { type: String, required: [true, 'El nombre del paciente es obligatorio'], trim: true },
    telefono: { type: String, trim: true, default: '' },
    correo: { type: String, trim: true, lowercase: true, default: '' },

    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: [true, 'El médico es obligatorio'] },
    especialidad: { type: String, trim: true, default: 'Medicina General' },

    fecha: { type: String, required: [true, 'La fecha es obligatoria'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)'] },
    hora: { type: String, required: [true, 'La hora es obligatoria'], match: [/^\d{2}:\d{2}$/, 'Hora inválida (HH:mm)'] },
    duracionMinutos: { type: Number, default: 30, min: [10, 'Duración mínima 10 min'], max: [240, 'Duración máxima 240 min'] },
    motivo: { type: String, trim: true, default: '' },

    estado: { type: String, enum: ['Confirmada', 'Atendida', 'Cancelada'], default: 'Confirmada' },
    fechaCancelacion: { type: Date },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

citaSchema.index({ medico: 1, fecha: 1 });

module.exports = mongoose.model('Cita', citaSchema, 'citas');
