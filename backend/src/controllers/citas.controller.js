// Controlador de citas médicas.
// Las citas usan horarios fijos de 30 minutos (utils/horarios.js), así que un horario
// está ocupado si ya hay una cita (no cancelada) con el mismo médico, fecha y hora.
const Cita = require('../models/Cita');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const { HORARIOS, fechaDeHoy, horaActual } = require('../utils/horarios');

const DATOS_PACIENTE = 'expediente nombre apellidoP apellidoM telefono';
const DATOS_MEDICO = 'nombre apellidoP apellidoM especialidad';

// Regresa la lista de horarios libres de un médico en una fecha
async function horariosLibres(medicoId, fecha) {
  const citas = await Cita.find({ medico: medicoId, fecha: fecha, estado: { $ne: 'Cancelada' } });
  const ocupados = citas.map((cita) => cita.hora);

  const libres = [];
  for (const hora of HORARIOS) {
    const yaPasoHoy = fecha === fechaDeHoy() && hora <= horaActual();
    if (!ocupados.includes(hora) && !yaPasoHoy) {
      libres.push(hora);
    }
  }
  return libres;
}

// GET /api/citas/disponibles?medico=&fecha=
async function disponibles(req, res, next) {
  try {
    const libres = await horariosLibres(req.query.medico, req.query.fecha);
    res.json({ success: true, data: libres });
  } catch (error) {
    next(error);
  }
}

// GET /api/citas/mias   (paciente: sus propias citas)
async function mias(req, res, next) {
  try {
    const citas = await Cita.find({ paciente: req.usuario.id })
      .populate('medico', DATOS_MEDICO)
      .sort({ fecha: -1, hora: -1 });
    res.json({ success: true, data: citas });
  } catch (error) {
    next(error);
  }
}

// GET /api/citas?fecha=&medico=&paciente=&estado=   (médico)
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.fecha) filtro.fecha = req.query.fecha;
    if (req.query.medico) filtro.medico = req.query.medico;
    if (req.query.paciente) filtro.paciente = req.query.paciente;
    if (req.query.estado) filtro.estado = req.query.estado;

    const citas = await Cita.find(filtro)
      .populate('paciente', DATOS_PACIENTE)
      .populate('medico', DATOS_MEDICO)
      .sort({ fecha: 1, hora: 1 });
    res.json({ success: true, data: citas });
  } catch (error) {
    next(error);
  }
}

// GET /api/citas/:id
async function obtener(req, res, next) {
  try {
    const cita = await Cita.findById(req.params.id).populate('paciente', DATOS_PACIENTE).populate('medico', DATOS_MEDICO);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }
    res.json({ success: true, data: cita });
  } catch (error) {
    next(error);
  }
}

// POST /api/citas   (paciente o médico)
async function crear(req, res, next) {
  try {
    // Si agenda el paciente, la cita es para él mismo
    let pacienteId = req.body.paciente;
    if (req.usuario.rol === 'paciente') pacienteId = req.usuario.id;

    const { medico, fecha, hora, motivo } = req.body;

    const existeMedico = await Usuario.findById(medico);
    if (!existeMedico) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }
    const existePaciente = await Paciente.findById(pacienteId);
    if (!existePaciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    const libres = await horariosLibres(medico, fecha);
    if (!libres.includes(hora)) {
      return res.status(409).json({ success: false, message: 'Ese horario ya no está disponible, elige otro' });
    }

    // El paciente no puede tener dos citas a la misma hora
    const choque = await Cita.findOne({ paciente: pacienteId, fecha: fecha, hora: hora, estado: { $ne: 'Cancelada' } });
    if (choque) {
      return res.status(409).json({ success: false, message: 'Ya tienes una cita a esa hora' });
    }

    const cita = await Cita.create({ paciente: pacienteId, medico, fecha, hora, motivo });
    await cita.populate('medico', DATOS_MEDICO);
    res.status(201).json({ success: true, message: 'Cita agendada exitosamente', data: cita });
  } catch (error) {
    next(error);
  }
}

// PUT /api/citas/:id   (médico: reprogramar fecha y hora)
async function reprogramar(req, res, next) {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }
    if (cita.estado !== 'Confirmada') {
      return res.status(409).json({ success: false, message: 'Solo se pueden reprogramar citas confirmadas' });
    }

    const libres = await horariosLibres(cita.medico, req.body.fecha);
    if (!libres.includes(req.body.hora)) {
      return res.status(409).json({ success: false, message: 'Ese horario no está disponible' });
    }

    cita.fecha = req.body.fecha;
    cita.hora = req.body.hora;
    if (req.body.motivo !== undefined) cita.motivo = req.body.motivo;
    await cita.save();
    res.json({ success: true, message: 'Cita reprogramada', data: cita });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/citas/:id/cancelar   (médico, o el paciente dueño de la cita)
async function cancelar(req, res, next) {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }
    if (req.usuario.rol === 'paciente' && String(cita.paciente) !== req.usuario.id) {
      return res.status(403).json({ success: false, message: 'Solo puedes cancelar tus propias citas' });
    }
    if (cita.estado !== 'Confirmada') {
      return res.status(409).json({ success: false, message: 'La cita ya está ' + cita.estado.toLowerCase() });
    }

    cita.estado = 'Cancelada';
    await cita.save();
    res.json({ success: true, message: 'Cita cancelada', data: cita });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/citas/:id   (médico)
async function eliminar(req, res, next) {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }
    if (cita.estado === 'Atendida') {
      return res.status(409).json({ success: false, message: 'La cita ya tiene una consulta registrada; no se puede eliminar' });
    }

    await Cita.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cita eliminada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { disponibles, mias, listar, obtener, crear, reprogramar, cancelar, eliminar };
