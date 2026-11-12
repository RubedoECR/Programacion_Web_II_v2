// Modelo: Usuario (médico). Colección "usuarios".
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellidoP: { type: String, trim: true, default: '' },
    apellidoM: { type: String, trim: true, default: '' },
    email: { type: String, required: [true, 'El correo es obligatorio'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'La contraseña es obligatoria'] },
    especialidad: { type: String, trim: true, default: 'Medicina General' },
    cedula: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    fechaNacimiento: { type: Date },
    activo: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // La contraseña nunca se manda al frontend
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

usuarioSchema.virtual('nombreCompleto').get(function () {
  return [this.nombre, this.apellidoP, this.apellidoM].filter(Boolean).join(' ');
});

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');
