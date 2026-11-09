// Controlador de citas médicas (incluye la detección de empalmes de horario).
const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');

const CAMPOS = ['paciente', 'nombre', 'telefono', 'correo', 'medico', 'especialidad', 'fecha', 'hora', 'duracionMinutos', 'motivo'];
const POPULATE = [
  { path: 'paciente', select: 'expediente nombre apellidoP apellidoM telefono' },
  { path: 'medico', select: 'nombre apellidoP apellidoM especialidad' },
];

const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

// Revisa que el médico y el paciente no tengan otra cita que se cruce en ese horario
async function verificarEmpalme(cita) {
  const condiciones = [{ medico: cita.medico }];
  if (cita.paciente) condiciones.push({ paciente: cita.paciente });

  const delDia = await Cita.find({
    _id: { $ne: cita._id },
    fecha: cita.fecha,
    estado: { $ne: 'Cancelada' },
    $or: condiciones,
  }).lean();

  const inicio = aMinutos(cita.hora);
  const fin = inicio + (cita.duracionMinutos || 30);

  for (const otra of delDia) {
    const inicioOtra = aMinutos(otra.hora);
    const finOtra = inicioOtra + (otra.duracionMinutos || 30);
    if (Math.max(inicio, inicioOtra) < Math.min(fin, finOtra)) {
      const esDelPaciente = cita.paciente && String(otra.paciente) === String(cita.paciente);
      const mensaje = esDelPaciente
        ? `El paciente ya tiene una cita a las ${otra.hora}`
        : `Horario no disponible: el médico tiene otra cita a las ${otra.hora}`;
      throw new ErrorApi(409, mensaje, { empalme: true, citaConflicto: { hora: otra.hora, duracion: otra.duracionMinutos } });
    }
  }
}

// Completa nombre/teléfono desde el paciente y valida que paciente y médico existan
async function completarReferencias(datos) {
  if (datos.paciente) {
    const paciente = await Paciente.findById(datos.paciente);
    if (!paciente) throw new ErrorApi(404, 'Paciente no encontrado');
    datos.nombre = datos.nombre || paciente.nombreCompleto;
    datos.telefono = datos.telefono || paciente.telefono;
    datos.correo = datos.correo || paciente.correo;
  } else if (datos.paciente === '') {
    datos.paciente = null;
  }
  if (datos.medico) {
    const medico = await Usuario.findById(datos.medico);
    if (!medico || !medico.activo) throw new ErrorApi(404, 'Médico no encontrado');
    datos.especialidad = datos.especialidad || medico.especialidad;
  }
}

// GET /api/citas?fecha=&medico=&paciente=&estado=
async function listar(req, res) {
  const filtro = elegir(req.query, ['fecha', 'medico', 'paciente', 'estado']);
  if (!filtro.estado && req.query.incluirCanceladas !== 'true') filtro.estado = { $ne: 'Cancelada' };

  const citas = await Cita.find(filtro).populate(POPULATE).sort({ fecha: 1, hora: 1 });
  res.json({ success: true, data: citas });
}

// GET /api/citas/:id
async function obtener(req, res) {
  const cita = await Cita.findById(req.params.id).populate(POPULATE);
  if (!cita) throw new ErrorApi(404, 'Cita no encontrada');
  res.json({ success: true, data: cita });
}

// POST /api/citas
async function crear(req, res) {
  const datos = elegir(req.body, CAMPOS);
  await completarReferencias(datos);

  const cita = new Cita(datos);
  await verificarEmpalme(cita);
  await cita.save();
  await cita.populate(POPULATE);
  res.status(201).json({ success: true, message: 'Cita agendada exitosamente', data: cita });
}

// PUT /api/citas/:id
async function actualizar(req, res) {
  const cita = await Cita.findById(req.params.id);
  if (!cita) throw new ErrorApi(404, 'Cita no encontrada');
  if (cita.estado !== 'Confirmada') throw new ErrorApi(409, `No se puede modificar una cita ${cita.estado.toLowerCase()}`);

  const datos = elegir(req.body, CAMPOS);
  await completarReferencias(datos);
  Object.assign(cita, datos);

  if (cita.isModified('fecha') || cita.isModified('hora') || cita.isModified('medico') || cita.isModified('duracionMinutos') || cita.isModified('paciente')) {
    await verificarEmpalme(cita);
  }
  await cita.save();
  await cita.populate(POPULATE);
  res.json({ success: true, message: 'Cita actualizada', data: cita });
}

// PATCH /api/citas/:id/cancelar
async function cancelar(req, res) {
  const cita = await Cita.findById(req.params.id);
  if (!cita) throw new ErrorApi(404, 'Cita no encontrada');
  if (cita.estado === 'Atendida') throw new ErrorApi(409, 'La cita ya fue atendida; no se puede cancelar');

  cita.estado = 'Cancelada';
  cita.fechaCancelacion = new Date();
  await cita.save();
  res.json({ success: true, message: 'Cita cancelada', data: cita });
}

// DELETE /api/citas/:id
async function eliminar(req, res) {
  const cita = await Cita.findById(req.params.id);
  if (!cita) throw new ErrorApi(404, 'Cita no encontrada');
  if (cita.estado === 'Atendida') throw new ErrorApi(409, 'La cita tiene una consulta registrada; no se puede eliminar');

  await cita.deleteOne();
  res.json({ success: true, message: 'Cita eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, cancelar, eliminar };
