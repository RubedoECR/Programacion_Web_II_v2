// Modelo: Cita médica. Colección "citas".
// Las citas duran 30 minutos y solo se pueden agendar en los horarios de utils/horarios.js
const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: [true, 'El paciente es obligatorio'] },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: [true, 'El médico es obligatorio'] },
    fecha: { type: String, required: [true, 'La fecha es obligatoria'] }, // AAAA-MM-DD
    hora: { type: String, required: [true, 'La hora es obligatoria'] }, // HH:mm
    motivo: { type: String, trim: true, default: '' },
    estado: { type: String, enum: ['Confirmada', 'Atendida', 'Cancelada'], default: 'Confirmada' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cita', citaSchema, 'citas');
