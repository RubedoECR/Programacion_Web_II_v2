const Consulta = require('../models/Consulta');
const Cita = require('../models/Cita');
const Receta = require('../models/Receta');
const Paciente = require('../models/Paciente');
const { fechaDeHoy, fechaEnZona } = require('../utils/horarios');

function rangoFechas(query, campo = 'fecha') {
  const rango = {};
  if (query.desde) rango.$gte = fechaEnZona(query.desde, false);
  if (query.hasta) rango.$lte = fechaEnZona(query.hasta, true);
  return Object.keys(rango).length ? { [campo]: rango } : {};
}

const nombreMedico = {
  $trim: { input: { $concat: ['$medico.nombre', ' ', { $ifNull: ['$medico.apellidoP', ''] }] } },
};

async function consultasPorMedico(req, res, next) {
  try {
    const data = await Consulta.aggregate([
      { $match: rangoFechas(req.query) },
      {
        $group: {
          _id: '$medico',
          totalConsultas: { $sum: 1 },
          pacientes: { $addToSet: '$paciente' },
          casosGraves: { $sum: { $cond: [{ $in: ['$severidad', ['Grave', 'Crítico']] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'medico' } },
      { $unwind: '$medico' },
      {
        $project: {
          _id: 0,
          medicoId: '$_id',
          medico: nombreMedico,
          especialidad: '$medico.especialidad',
          totalConsultas: 1,
          pacientesAtendidos: { $size: '$pacientes' },
          casosGraves: 1,
        },
      },
      { $sort: { totalConsultas: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function asistenciaCitas(req, res, next) {
  try {
    const filtro = {};
    if (req.query.desde || req.query.hasta) {
      filtro.fecha = {};
      if (req.query.desde) filtro.fecha.$gte = req.query.desde;
      if (req.query.hasta) filtro.fecha.$lte = req.query.hasta;
    }
    const data = await Cita.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: '$medico',
          total: { $sum: 1 },
          confirmadas: { $sum: { $cond: [{ $eq: ['$estado', 'Confirmada'] }, 1, 0] } },
          atendidas: { $sum: { $cond: [{ $eq: ['$estado', 'Atendida'] }, 1, 0] } },
          canceladas: { $sum: { $cond: [{ $eq: ['$estado', 'Cancelada'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'medico' } },
      { $unwind: '$medico' },
      {
        $project: {
          _id: 0,
          medicoId: '$_id',
          medico: nombreMedico,
          total: 1,
          confirmadas: 1,
          atendidas: 1,
          canceladas: 1,
          porcentajeAsistencia: {
            $cond: [
              { $gt: [{ $add: ['$atendidas', '$canceladas'] }, 0] },
              { $round: [{ $multiply: [{ $divide: ['$atendidas', { $add: ['$atendidas', '$canceladas'] }] }, 100] }, 1] },
              null,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function diagnosticosFrecuentes(req, res, next) {
  try {
    const data = await Consulta.aggregate([
      { $match: rangoFechas(req.query) },
      { $unwind: '$diagnosticos' },
      { $lookup: { from: 'pacientes', localField: 'paciente', foreignField: '_id', as: 'paciente' } },
      { $unwind: '$paciente' },
      {
        $group: {
          _id: '$diagnosticos',
          veces: { $sum: 1 },
          pacientes: { $addToSet: '$paciente._id' },
          mujeres: { $sum: { $cond: [{ $eq: ['$paciente.sexo', 'Femenino'] }, 1, 0] } },
          hombres: { $sum: { $cond: [{ $eq: ['$paciente.sexo', 'Masculino'] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, diagnostico: '$_id', veces: 1, pacientesDistintos: { $size: '$pacientes' }, mujeres: 1, hombres: 1 } },
      { $sort: { veces: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function medicamentosMasRecetados(req, res, next) {
  try {
    const data = await Receta.aggregate([
      { $match: rangoFechas(req.query) },
      { $unwind: '$medicamentos' },
      {
        $group: {
          _id: { $toLower: '$medicamentos.nombre' },
          nombre: { $first: '$medicamentos.nombre' },
          medicamentoId: { $first: '$medicamentos.medicamento' },
          veces: { $sum: 1 },
          pacientes: { $addToSet: '$paciente' },
        },
      },
      { $lookup: { from: 'medicamentos', localField: 'medicamentoId', foreignField: '_id', as: 'catalogo' } },
      {
        $project: {
          _id: 0,
          nombre: 1,
          veces: 1,
          pacientesDistintos: { $size: '$pacientes' },
          enCatalogo: { $gt: [{ $size: '$catalogo' }, 0] },
          presentacion: { $ifNull: [{ $first: '$catalogo.presentacion' }, ''] },
        },
      },
      { $sort: { veces: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function pacientesFrecuentes(req, res, next) {
  try {
    const data = await Consulta.aggregate([
      { $match: rangoFechas(req.query) },
      { $group: { _id: '$paciente', consultas: { $sum: 1 }, ultimaVisita: { $max: '$fecha' } } },
      { $lookup: { from: 'pacientes', localField: '_id', foreignField: '_id', as: 'paciente' } },
      { $unwind: '$paciente' },
      {
        $project: {
          _id: 0,
          pacienteId: '$_id',
          expediente: '$paciente.expediente',
          nombre: { $concat: ['$paciente.nombre', ' ', '$paciente.apellidoP'] },
          consultas: 1,
          ultimaVisita: 1,
        },
      },
      { $sort: { consultas: -1, ultimaVisita: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function resumen(req, res, next) {
  try {
    const hoy = fechaDeHoy();
    const inicioMes = fechaEnZona(hoy.slice(0, 8) + '01', false);

    const [pacientesActivos, citasHoy, consultasMes, consultasMesPropias] = await Promise.all([
      Paciente.countDocuments({ estado: 'Activo' }),
      Cita.countDocuments({ fecha: hoy, estado: { $ne: 'Cancelada' } }),
      Consulta.countDocuments({ fecha: { $gte: inicioMes } }),
      Consulta.countDocuments({ fecha: { $gte: inicioMes }, medico: req.usuario.id }),
    ]);

    res.json({ success: true, data: { pacientesActivos, citasHoy, consultasMes, consultasMesPropias } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  consultasPorMedico,
  asistenciaCitas,
  diagnosticosFrecuentes,
  medicamentosMasRecetados,
  pacientesFrecuentes,
  resumen,
};
