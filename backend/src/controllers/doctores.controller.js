// Controlador de médicos (colección usuarios). El alta se hace en /auth/registro.
const Usuario = require('../models/Usuario');
const Cita = require('../models/Cita');
const Consulta = require('../models/Consulta');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');

const CAMPOS_EDITABLES = ['nombre', 'apellidoP', 'apellidoM', 'email', 'especialidad', 'cedula', 'telefono', 'password'];

// Un médico solo puede modificar o borrar su propia cuenta (salvo que sea admin)
function verificarPropietario(req) {
  if (req.usuario.rol !== 'admin' && req.usuario.id !== req.params.id) {
    throw new ErrorApi(403, 'Solo puedes modificar tu propia cuenta');
  }
}

// GET /api/doctores
async function listar(req, res) {
  const doctores = await Usuario.find({ activo: true }).sort({ nombre: 1 });
  res.json({ success: true, data: doctores });
}

// GET /api/doctores/:id
async function obtener(req, res) {
  const doctor = await Usuario.findById(req.params.id);
  if (!doctor) throw new ErrorApi(404, 'Médico no encontrado');
  res.json({ success: true, data: doctor });
}

// PUT /api/doctores/:id
async function actualizar(req, res) {
  verificarPropietario(req);
  const doctor = await Usuario.findById(req.params.id);
  if (!doctor) throw new ErrorApi(404, 'Médico no encontrado');

  const cambios = elegir(req.body, CAMPOS_EDITABLES);
  if (!cambios.password) delete cambios.password;
  if (cambios.email && cambios.email !== doctor.email) {
    if (await Usuario.exists({ email: cambios.email, _id: { $ne: doctor._id } })) {
      throw new ErrorApi(409, 'Ese correo ya está registrado');
    }
    cambios.usuario = cambios.email;
  }

  Object.assign(doctor, cambios);
  await doctor.save(); // save() dispara el cifrado de contraseña
  res.json({ success: true, message: 'Datos del médico actualizados', data: doctor });
}

// DELETE /api/doctores/:id
async function eliminar(req, res) {
  verificarPropietario(req);
  const id = req.params.id;

  const [tieneConsultas, tieneCitas] = await Promise.all([
    Consulta.exists({ medico: id }),
    Cita.exists({ medico: id, estado: 'Confirmada' }),
  ]);
  if (tieneConsultas || tieneCitas) {
    throw new ErrorApi(409, 'El médico tiene consultas o citas pendientes; no se puede eliminar');
  }

  const borrado = await Usuario.findByIdAndDelete(id);
  if (!borrado) throw new ErrorApi(404, 'Médico no encontrado');
  res.json({ success: true, message: 'Médico eliminado' });
}

module.exports = { listar, obtener, actualizar, eliminar };
