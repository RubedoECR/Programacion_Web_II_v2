const Consulta = require('../models/Consulta');
const Receta = require('../models/Receta');
const Paciente = require('../models/Paciente');
const Cita = require('../models/Cita');

const CAMPOS = [
  'fecha', 'tipoConsulta', 'categoria', 'severidad',
  'presion', 'frecuencia', 'frecuenciaResp', 'saturacionO2', 'temperatura', 'peso', 'talla',
  'sintomas', 'diagnosticos', 'alergias', 'notas',
];

function datosDeLaConsulta(body) {
  const datos = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }
  return datos;
}

function calcularImc(peso, talla) {
  if (!peso || !talla) return undefined;
  const metros = talla / 100;
  return Math.round((peso / (metros * metros)) * 10) / 10;
}

function buscarCompleta(filtro) {
  return Consulta.find(filtro)
    .populate('paciente', 'expediente nombre apellidoP apellidoM fechaNacimiento sexo tipoSangre')
    .populate('medico', 'nombre apellidoP apellidoM especialidad cedula')
    .populate('receta', 'folio')
    .sort({ fecha: -1 });
}

async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.paciente) filtro.paciente = req.query.paciente;
    const consultas = await buscarCompleta(filtro);
    res.json({ success: true, data: consultas });
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const consultas = await buscarCompleta({ _id: req.params.id });
    if (consultas.length === 0) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }
    res.json({ success: true, data: consultas[0] });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const paciente = await Paciente.findById(req.body.paciente);
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    if (paciente.estado === 'Inactivo') {
      return res.status(409).json({ success: false, message: 'El paciente está inactivo' });
    }

    let cita = null;
    if (req.body.cita) {
      cita = await Cita.findById(req.body.cita);
      if (!cita) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      if (String(cita.paciente) !== String(paciente._id)) {
        return res.status(409).json({ success: false, message: 'La cita no corresponde a ese paciente' });
      }
      if (cita.estado !== 'Confirmada') {
        return res.status(409).json({ success: false, message: 'La cita ya está ' + cita.estado.toLowerCase() });
      }
    }

    const datos = datosDeLaConsulta(req.body);
    datos.paciente = paciente._id;
    datos.medico = req.usuario.id;
    datos.cita = cita ? cita._id : null;
    datos.imc = calcularImc(datos.peso, datos.talla);

    const consulta = await Consulta.create(datos);
    let receta;
    try {
      receta = await Receta.create({
        consulta: consulta._id,
        paciente: paciente._id,
        medico: req.usuario.id,
        fecha: consulta.fecha,
        folio: 'REC-' + String(consulta._id).slice(-6).toUpperCase(),
        medicamentos: req.body.medicamentos || [],
        indicaciones: req.body.indicaciones || '',
      });

      if (cita) {
        cita.estado = 'Atendida';
        await cita.save();
      }
    } catch (error) {
      if (receta) await Receta.findByIdAndDelete(receta._id);
      await Consulta.findByIdAndDelete(consulta._id);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Consulta guardada exitosamente',
      data: { consulta: consulta, receta: receta },
    });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const consulta = await Consulta.findById(req.params.id);
    if (!consulta) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    Object.assign(consulta, datosDeLaConsulta(req.body));
    consulta.imc = calcularImc(consulta.peso, consulta.talla);
    await consulta.save();
    res.json({ success: true, message: 'Consulta actualizada', data: consulta });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const consulta = await Consulta.findById(req.params.id);
    if (!consulta) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    await Receta.deleteMany({ consulta: consulta._id });
    if (consulta.cita) {
      await Cita.findByIdAndUpdate(consulta.cita, { estado: 'Confirmada' });
    }
    await Consulta.findByIdAndDelete(consulta._id);
    res.json({ success: true, message: 'Consulta eliminada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
