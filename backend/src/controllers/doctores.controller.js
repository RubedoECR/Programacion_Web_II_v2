const Usuario = require('../models/Usuario');
const Cita = require('../models/Cita');
const Consulta = require('../models/Consulta');

async function listar(req, res, next) {
  try {
    const doctores = await Usuario.find({ activo: { $ne: false } }).sort({ nombre: 1 });
    res.json({ success: true, data: doctores });
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const doctor = await Usuario.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    if (req.params.id !== req.usuario.id) {
      return res.status(403).json({ success: false, message: 'Solo puedes modificar tu propia cuenta' });
    }

    const cambios = {};
    const campos = ['nombre', 'apellidoP', 'apellidoM', 'especialidad', 'cedula', 'telefono'];
    for (const campo of campos) {
      if (req.body[campo] !== undefined) cambios[campo] = req.body[campo];
    }
    if (req.body.password) cambios.password = req.body.password;

    if (req.body.email) {
      const email = req.body.email.trim().toLowerCase();
      const otro = await Usuario.findOne({ email: email, _id: { $ne: req.params.id } });
      if (otro) {
        return res.status(409).json({ success: false, message: 'Ese correo ya está registrado' });
      }
      cambios.email = email;
    }

    const doctor = await Usuario.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }
    res.json({ success: true, message: 'Datos actualizados', data: doctor });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const id = req.params.id;
    if (id !== req.usuario.id) {
      return res.status(403).json({ success: false, message: 'Solo puedes eliminar tu propia cuenta' });
    }

    const tieneConsultas = await Consulta.findOne({ medico: id });
    const tieneCitas = await Cita.findOne({ medico: id, estado: 'Confirmada' });
    if (tieneConsultas || tieneCitas) {
      return res.status(409).json({
        success: false,
        message: 'Tienes consultas o citas pendientes registradas; no se puede eliminar la cuenta',
      });
    }

    await Usuario.findByIdAndDelete(id);
    res.json({ success: true, message: 'Cuenta eliminada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, actualizar, eliminar };
