// Controlador de pacientes.
const Paciente = require('../models/Paciente');
const Consulta = require('../models/Consulta');
const Cita = require('../models/Cita');
const ErrorApi = require('../utils/ErrorApi');
const elegir = require('../utils/elegir');

const CAMPOS = ['nombre', 'apellidoP', 'apellidoM', 'fechaNacimiento', 'sexo', 'telefono', 'correo', 'tipoSangre', 'direccion', 'alergias', 'estado'];

// El formulario manda contactoNombre / contactoParentesco / contactoTelefono por separado
function armarDatos(body) {
  const datos = elegir(body, CAMPOS);
  const contacto = body.contactoEmergencia || {};
  const nombre = body.contactoNombre ?? contacto.nombre;
  const parentesco = body.contactoParentesco ?? contacto.parentesco;
  const telefono = body.contactoTelefono ?? contacto.telefono;
  if (nombre !== undefined || parentesco !== undefined || telefono !== undefined) {
    datos.contactoEmergencia = { nombre: nombre || '', parentesco: parentesco || '', telefono: telefono || '' };
  }
  return datos;
}

async function siguienteExpediente() {
  const ultimo = await Paciente.findOne({ expediente: /^EXP-\d{6}$/ }).sort({ expediente: -1 }).select('expediente').lean();
  const numero = ultimo ? parseInt(ultimo.expediente.slice(4), 10) + 1 : 1;
  return `EXP-${String(numero).padStart(6, '0')}`;
}

// Busca por _id de Mongo o por número de expediente
function filtroPorId(id) {
  return /^EXP-\d{6}$/.test(id) ? { expediente: id } : { _id: id };
}

// GET /api/pacientes?buscar=texto&estado=Activo
async function listar(req, res) {
  const filtro = {};
  if (req.query.estado) filtro.estado = req.query.estado;
  if (req.query.buscar) {
    const texto = req.query.buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(texto, 'i');
    filtro.$or = [{ nombre: regex }, { apellidoP: regex }, { apellidoM: regex }, { expediente: regex }, { telefono: regex }];
  }
  const pacientes = await Paciente.find(filtro).sort({ expediente: -1 });
  res.json({ success: true, data: pacientes });
}

// GET /api/pacientes/:id   (id o expediente)
async function obtener(req, res) {
  const paciente = await Paciente.findOne(filtroPorId(req.params.id));
  if (!paciente) throw new ErrorApi(404, 'Paciente no encontrado');
  res.json({ success: true, data: paciente });
}

// POST /api/pacientes
async function crear(req, res) {
  const datos = armarDatos(req.body);

  // Si dos registros llegan al mismo tiempo y chocan en el expediente, se reintenta
  for (let intento = 0; intento < 3; intento++) {
    try {
      const paciente = await Paciente.create({ ...datos, expediente: await siguienteExpediente() });
      return res.status(201).json({ success: true, message: 'Paciente registrado exitosamente', data: paciente });
    } catch (error) {
      if (error.code !== 11000 || !error.keyValue?.expediente) throw error;
    }
  }
  throw new ErrorApi(503, 'No se pudo generar el expediente, intenta de nuevo');
}

// PUT /api/pacientes/:id
async function actualizar(req, res) {
  const paciente = await Paciente.findById(req.params.id);
  if (!paciente) throw new ErrorApi(404, 'Paciente no encontrado');

  Object.assign(paciente, armarDatos(req.body));
  await paciente.save();
  res.json({ success: true, message: 'Paciente actualizado', data: paciente });
}

// DELETE /api/pacientes/:id
async function eliminar(req, res) {
  const id = req.params.id;
  const [tieneConsultas, tieneCitas] = await Promise.all([
    Consulta.exists({ paciente: id }),
    Cita.exists({ paciente: id, estado: 'Confirmada' }),
  ]);
  if (tieneConsultas || tieneCitas) {
    throw new ErrorApi(409, 'El paciente tiene consultas o citas registradas; márcalo como Inactivo en lugar de eliminarlo');
  }

  const borrado = await Paciente.findByIdAndDelete(id);
  if (!borrado) throw new ErrorApi(404, 'Paciente no encontrado');
  await Cita.deleteMany({ paciente: id }); // citas canceladas que quedaban
  res.json({ success: true, message: 'Paciente eliminado' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
