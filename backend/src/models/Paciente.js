const mongoose = require('mongoose');
const { fechaDeHoy } = require('../utils/horarios');

const pacienteSchema = new mongoose.Schema(
  {
    expediente: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellidoP: { type: String, required: [true, 'El apellido paterno es obligatorio'], trim: true },
    apellidoM: { type: String, trim: true, default: '' },
    fechaNacimiento: { type: Date, required: [true, 'La fecha de nacimiento es obligatoria'] },
    sexo: { type: String, enum: ['Masculino', 'Femenino', 'Otro'], required: [true, 'El sexo es obligatorio'] },
    telefono: { type: String, required: [true, 'El teléfono es obligatorio'], trim: true },
    correo: { type: String, required: [true, 'El correo es obligatorio'], trim: true, lowercase: true },
    password: { type: String, required: [true, 'La contraseña es obligatoria'] },
    tipoSangre: { type: String, enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: '' },
    direccion: { type: String, trim: true, default: '' },
    alergias: { type: [String], default: [] },
    contactoEmergencia: {
      nombre: { type: String, trim: true, default: '' },
      parentesco: { type: String, trim: true, default: '' },
      telefono: { type: String, trim: true, default: '' },
    },
    estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

pacienteSchema.virtual('nombreCompleto').get(function () {
  return [this.nombre, this.apellidoP, this.apellidoM].filter(Boolean).join(' ');
});

pacienteSchema.virtual('edad').get(function () {
  if (!this.fechaNacimiento) return null;
  const [anioHoy, mesHoy, diaHoy] = fechaDeHoy().split('-').map(Number);
  const nacimiento = new Date(this.fechaNacimiento);
  let edad = anioHoy - nacimiento.getUTCFullYear();
  const mesNac = nacimiento.getUTCMonth() + 1;
  const diaNac = nacimiento.getUTCDate();
  const yaCumplio = mesHoy > mesNac || (mesHoy === mesNac && diaHoy >= diaNac);
  if (!yaCumplio) edad = edad - 1;
  return edad;
});

module.exports = mongoose.model('Paciente', pacienteSchema, 'pacientes');
