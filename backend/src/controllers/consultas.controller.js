// Controlador de consultas médicas.
// Al crear una consulta se genera su receta y, si viene de una cita, la cita pasa a "Atendida".
const Consulta = require('../models/Consulta');
const Receta = require('../models/Receta');
const Paciente = require('../models/Paciente');
const Cita = require('../models/Cita');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');
const logger = require('../utils/logger');

const CAMPOS = [
  'paciente', 'cita', 'fecha', 'tipoConsulta', 'categoria', 'severidad',
  'presion', 'frecuencia', 'frecuenciaResp', 'saturacionO2', 'temperatura', 'peso', 'talla',
  'sintomas', 'diagnosticos', 'alergias', 'notas',
];
const POPULATE = [
  { path: 'paciente', select: 'expediente nombre apellidoP apellidoM fechaNacimiento sexo tipoSangre' },
  { path: 'medico', select: 'nombre apellidoP apellidoM especialidad cedula' },
  { path: 'receta', select: 'folio' },
];

function calcularImc(consulta) {
  if (consulta.peso && consulta.talla) {
    const metros = consulta.talla / 100;
    consulta.imc = Math.round((consulta.peso / (metros * metros)) * 10) / 10;
  } else {
    consulta.imc = undefined;
  }
}

function verificarAutor(req, consulta) {
  if (req.usuario.rol !== 'admin' && String(consulta.medico) !== req.usuario.id) {
    throw new ErrorApi(403, 'Solo el médico que registró la consulta puede modificarla');
  }
}

// GET /api/consultas?paciente=&medico=
async function listar(req, res) {
  const filtro = elegir(req.query, ['paciente', 'medico']);
  const consultas = await Consulta.find(filtro).populate(POPULATE).sort({ fecha: -1 });
  res.json({ success: true, data: consultas });
}

// GET /api/consultas/:id
async function obtener(req, res) {
  const consulta = await Consulta.findById(req.params.id).populate([...POPULATE, { path: 'cita' }]);
  if (!consulta) throw new ErrorApi(404, 'Consulta no encontrada');
  res.json({ success: true, data: consulta });
}

// POST /api/consultas
async function crear(req, res) {
  const datos = elegir(req.body, CAMPOS);

  const paciente = await Paciente.findById(datos.paciente);
  if (!paciente) throw new ErrorApi(404, 'Paciente no encontrado');
  if (paciente.estado === 'Inactivo') throw new ErrorApi(409, 'El paciente está inactivo');

  let cita = null;
  if (datos.cita) {
    cita = await Cita.findById(datos.cita);
    if (!cita) throw new ErrorApi(404, 'Cita no encontrada');
    if (cita.estado !== 'Confirmada') throw new ErrorApi(409, `La cita ya está ${cita.estado.toLowerCase()}`);
  } else {
    datos.cita = null;
  }

  // El médico siempre es el de la sesión (sale del token, no del formulario)
  const consulta = new Consulta({ ...datos, medico: req.usuario.id });
  calcularImc(consulta);
  await consulta.save();

  let receta;
  try {
    receta = await Receta.create({
      consulta: consulta._id,
      paciente: consulta.paciente,
      medico: consulta.medico,
      fecha: consulta.fecha,
      medicamentos: Array.isArray(req.body.medicamentos) ? req.body.medicamentos : [],
      indicaciones: req.body.indicaciones || '',
    });
  } catch (error) {
    // Si la receta falla, se deshace la consulta para no dejar datos a medias
    await consulta.deleteOne();
    logger.error('Se revirtió la consulta porque la receta falló', { consulta: String(consulta._id) });
    throw error;
  }

  if (cita) {
    cita.estado = 'Atendida';
    await cita.save();
  }

  await consulta.populate(POPULATE);
  res.status(201).json({
    success: true,
    message: 'Consulta guardada exitosamente',
    data: { consulta, receta },
  });
}

// PUT /api/consultas/:id
async function actualizar(req, res) {
  const consulta = await Consulta.findById(req.params.id);
  if (!consulta) throw new ErrorApi(404, 'Consulta no encontrada');
  verificarAutor(req, consulta);

  const cambios = elegir(req.body, CAMPOS);
  delete cambios.paciente; // una consulta no cambia de paciente
  delete cambios.cita;
  Object.assign(consulta, cambios);
  calcularImc(consulta);
  await consulta.save();
  await consulta.populate(POPULATE);
  res.json({ success: true, message: 'Consulta actualizada', data: consulta });
}

// DELETE /api/consultas/:id  (borra también su receta y libera la cita)
async function eliminar(req, res) {
  const consulta = await Consulta.findById(req.params.id);
  if (!consulta) throw new ErrorApi(404, 'Consulta no encontrada');
  verificarAutor(req, consulta);

  await Receta.deleteOne({ consulta: consulta._id });
  if (consulta.cita) await Cita.updateOne({ _id: consulta.cita }, { estado: 'Confirmada' });
  await consulta.deleteOne();
  res.json({ success: true, message: 'Consulta eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
