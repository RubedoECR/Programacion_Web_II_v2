const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: [true, 'El paciente es obligatorio'] },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: [true, 'El médico es obligatorio'] },
    fecha: { type: String, required: [true, 'La fecha es obligatoria'] },
    hora: { type: String, required: [true, 'La hora es obligatoria'] },
    motivo: { type: String, trim: true, default: '' },
    estado: { type: String, enum: ['Confirmada', 'Atendida', 'Cancelada'], default: 'Confirmada' },
  },
  { timestamps: true }
);

const CITA_ACTIVA = { estado: { $in: ['Confirmada', 'Atendida'] } };
citaSchema.index({ medico: 1, fecha: 1, hora: 1 }, { unique: true, partialFilterExpression: CITA_ACTIVA });
citaSchema.index({ paciente: 1, fecha: 1, hora: 1 }, { unique: true, partialFilterExpression: CITA_ACTIVA });

module.exports = mongoose.model('Cita', citaSchema, 'citas');
