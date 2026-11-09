// Modelo: Paciente. Colección "pacientes".
const mongoose = require('mongoose');

const contactoSchema = new mongoose.Schema(
  {
    nombre: { type: String, trim: true, default: '' },
    parentesco: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const pacienteSchema = new mongoose.Schema(
  {
    expediente: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellidoP: { type: String, required: [true, 'El apellido paterno es obligatorio'], trim: true },
    apellidoM: { type: String, trim: true, default: '' },
    fechaNacimiento: { type: Date, required: [true, 'La fecha de nacimiento es obligatoria'] },
    sexo: {
      type: String,
      required: [true, 'El sexo es obligatorio'],
      enum: { values: ['Masculino', 'Femenino', 'Otro'], message: 'Sexo no válido' },
    },
    telefono: { type: String, required: [true, 'El teléfono es obligatorio'], trim: true },
    correo: { type: String, trim: true, lowercase: true, default: '' },
    tipoSangre: {
      type: String,
      enum: { values: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], message: 'Tipo de sangre no válido' },
      default: '',
    },
    direccion: { type: String, trim: true, default: '' },
    alergias: { type: [String], default: [] },
    contactoEmergencia: { type: contactoSchema, default: () => ({}) },
    estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  }
);

pacienteSchema.virtual('nombreCompleto').get(function () {
  return [this.nombre, this.apellidoP, this.apellidoM].filter(Boolean).join(' ');
});

// Edad exacta (considera si ya pasó el cumpleaños este año)
pacienteSchema.virtual('edad').get(function () {
  if (!this.fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(this.fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
});

module.exports = mongoose.model('Paciente', pacienteSchema, 'pacientes');
