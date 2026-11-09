// Modelo: Usuario (médico). Colección "usuarios".
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellidoP: { type: String, trim: true, default: '' },
    apellidoM: { type: String, trim: true, default: '' },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El correo no es válido'],
    },
    usuario: { type: String, trim: true, unique: true, sparse: true },
    password: { type: String, required: [true, 'La contraseña es obligatoria'], select: false },
    especialidad: { type: String, trim: true, default: 'Medicina General' },
    cedula: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    fechaNacimiento: { type: Date },
    rol: { type: String, enum: ['medico', 'admin'], default: 'medico' },
    activo: { type: Boolean, default: true },
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

usuarioSchema.virtual('nombreCompleto').get(function () {
  return [this.nombre, this.apellidoP, this.apellidoM].filter(Boolean).join(' ');
});

const esHash = (valor) => typeof valor === 'string' && /^\$2[aby]\$\d{2}\$/.test(valor);

// Antes de guardar, cifra la contraseña si cambió
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password') || esHash(this.password)) return;
  this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararPassword = async function (passwordPlano) {
  // Compatibilidad con usuarios viejos que tenían la contraseña sin cifrar:
  // si coincide, se cifra en ese momento.
  if (!esHash(this.password)) {
    if (this.password !== passwordPlano) return false;
    this.password = await bcrypt.hash(passwordPlano, 10);
    await this.save({ validateBeforeSave: false });
    return true;
  }
  return bcrypt.compare(passwordPlano, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');
