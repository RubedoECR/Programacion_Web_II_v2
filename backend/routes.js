const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('./db');
const {
  validarLogin,
  validarRegistroMedico,
  validarRegistroPaciente,
  validarConsulta,
  validarCita
} = require('./middlewares');
const {
  createUserSchema,
  createPatientSchema,
  createConsultaSchema,
  createCitaSchema
} = require('./schemas');

const router = express.Router();

// Helper para convertir hora HH:mm a minutos desde las 00:00
function horaAMinutos(horaStr) {
  if (!horaStr) return 0;
  const match = horaStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let horas = parseInt(match[1], 10);
  const minutos = parseInt(match[2], 10);
  const meridiano = match[3] ? match[3].toUpperCase() : null;
  if (meridiano === 'PM' && horas < 12) horas += 12;
  if (meridiano === 'AM' && horas === 12) horas = 0;
  return horas * 60 + minutos;
}

// Helper para parsear ObjectId de forma segura
function toObjectId(id) {
  if (!id) return null;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// =====================================
// AUTENTICACIÓN Y USUARIOS / DOCTORES
// =====================================

// POST /api/login
router.post('/login', validarLogin, async (req, res) => {
  try {
    const { users } = getCollections();
    const { usuario, password } = req.body;

    const user = await users.findOne({
      $or: [
        { usuario: usuario },
        { email: usuario },
        { correo: usuario }
      ]
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    const nombreCompleto = [user.nombre, user.apellidoP, user.apellidoM].filter(Boolean).join(' ').trim() || user.nombre || 'Doctor';

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        id: user._id,
        nombre: nombreCompleto,
        usuario: user.usuario,
        especialidad: user.especialidad || 'Medicina General',
        cedula: user.cedula || '',
        email: user.email || user.correo || '',
        telefono: user.telefono || '',
        rol: user.rol || 'medico'
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// POST /api/register (Registro de Médicos/Doctores)
router.post('/register', validarRegistroMedico, async (req, res) => {
  try {
    const { users } = getCollections();
    const newUser = createUserSchema(req.body);

    if (newUser.usuario) {
      const userExists = await users.findOne({
        $or: [{ usuario: newUser.usuario }, { email: newUser.email }]
      });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'El usuario o correo electrónico ya se encuentra registrado'
        });
      }
    }

    const result = await users.insertOne(newUser);
    res.status(201).json({
      success: true,
      message: 'Doctor registrado exitosamente',
      data: {
        id: result.insertedId,
        usuario: newUser.usuario,
        nombre: `${newUser.nombre} ${newUser.apellidoP}`.trim(),
        email: newUser.email,
        especialidad: newUser.especialidad,
        cedula: newUser.cedula,
        rol: newUser.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// GET /api/doctores
router.get('/doctores', async (req, res) => {
  try {
    const { users } = getCollections();
    const doctores = await users.find({}).toArray();
    const data = doctores.map(d => {
      const nombreCompleto = [d.nombre, d.apellidoP, d.apellidoM].filter(Boolean).join(' ').trim() || d.nombre || 'Doctor';
      return {
        id: d._id,
        nombre: nombreCompleto,
        especialidad: d.especialidad || 'Medicina General',
        email: d.email || d.correo || '',
        cedula: d.cedula || '',
        telefono: d.telefono || '',
        usuario: d.usuario || ''
      };
    });
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error obteniendo doctores:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// GET /api/doctores/:id
router.get('/doctores/:id', async (req, res) => {
  try {
    const { users } = getCollections();
    const { id } = req.params;
    const objId = toObjectId(id);

    const doc = await users.findOne({
      $or: [
        ...(objId ? [{ _id: objId }] : []),
        { _id: id },
        { usuario: id },
        { email: id }
      ]
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
    }

    const nombreCompleto = [doc.nombre, doc.apellidoP, doc.apellidoM].filter(Boolean).join(' ').trim() || doc.nombre || 'Doctor';

    res.json({
      success: true,
      data: {
        id: doc._id,
        nombre: nombreCompleto,
        especialidad: doc.especialidad || 'Medicina General',
        cedula: doc.cedula || '',
        email: doc.email || doc.correo || '',
        telefono: doc.telefono || '',
        usuario: doc.usuario || ''
      }
    });
  } catch (error) {
    console.error('Error obteniendo doctor por id:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// =====================================
// PACIENTES
// =====================================

// POST /api/paciente/registrar
router.post('/paciente/registrar', validarRegistroPaciente, async (req, res) => {
  try {
    const { patients } = getCollections();

    // Generar número de expediente secuencial
    const ultimoPaciente = await patients.find({}).sort({ _id: -1 }).limit(1).toArray();
    let siguienteNum = 1;
    if (ultimoPaciente.length > 0 && ultimoPaciente[0].expediente) {
      const match = ultimoPaciente[0].expediente.match(/\d+/);
      if (match) {
        siguienteNum = parseInt(match[0], 10) + 1;
      }
    }
    const expediente = 'EXP-' + String(siguienteNum).padStart(6, '0');

    const newPaciente = createPatientSchema(req.body, expediente);
    const result = await patients.insertOne(newPaciente);

    res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente en MongoDB',
      data: {
        id: result.insertedId,
        expediente: expediente,
        paciente: newPaciente
      }
    });
  } catch (error) {
    console.error('Error registrando paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al registrar paciente'
    });
  }
});

// GET /api/pacientes
router.get('/pacientes', async (req, res) => {
  try {
    const { patients } = getCollections();
    const pacientes = await patients.find({}).toArray();
    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// GET /api/pacientes/:identificador (por expediente o por _id)
router.get('/pacientes/:identificador', async (req, res) => {
  try {
    const { patients } = getCollections();
    const { identificador } = req.params;
    const objId = toObjectId(identificador);

    const paciente = await patients.findOne({
      $or: [
        { expediente: identificador },
        ...(objId ? [{ _id: objId }] : []),
        { _id: identificador }
      ]
    });

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    res.json({
      success: true,
      data: paciente
    });
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// =====================================
// CONSULTAS
// =====================================

// POST /api/consulta/guardar
router.post('/consulta/guardar', validarConsulta, async (req, res) => {
  try {
    const { consultas, citas, recetas } = getCollections();
    const newConsulta = createConsultaSchema(req.body);
    const result = await consultas.insertOne(newConsulta);
    const consultaId = result.insertedId;

    // Si viene asociada a una cita, marcar la cita como 'Atendida'
    if (req.body.citaId) {
      const citaObjId = toObjectId(req.body.citaId);
      await citas.updateOne(
        { $or: [...(citaObjId ? [{ _id: citaObjId }] : []), { _id: req.body.citaId }] },
        { $set: { estado: 'Atendida', consultaId: consultaId, fechaAtendida: new Date() } }
      );
    }

    // Si la consulta incluye medicamentos, crear automáticamente la receta correspondiente
    let recetaId = null;
    if (Array.isArray(newConsulta.medicamentos) && newConsulta.medicamentos.length > 0) {
      const nuevaReceta = {
        consultaId: consultaId,
        pacienteId: newConsulta.pacienteId || '',
        pacienteExpediente: newConsulta.pacienteExpediente || '',
        pacienteNombre: newConsulta.pacienteNombre || '',
        medico: newConsulta.medico || '',
        medicoId: req.body.medicoId || '',
        cedula: req.body.cedula || '',
        especialidad: req.body.especialidad || 'Medicina General',
        diagnosticos: newConsulta.diagnosticos || [],
        medicamentos: newConsulta.medicamentos || [],
        alergias: newConsulta.alergias || [],
        notas: newConsulta.notas || '',
        fecha: newConsulta.fecha || new Date(),
        fechaCreacion: new Date()
      };
      const resReceta = await recetas.insertOne(nuevaReceta);
      recetaId = resReceta.insertedId;
    }

    res.status(201).json({
      success: true,
      message: 'Consulta guardada exitosamente',
      data: {
        id: consultaId,
        recetaId: recetaId
      }
    });
  } catch (error) {
    console.error('Error guardando consulta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// GET /api/consulta/:id (Obtener una consulta específica por ID)
router.get('/consulta/:id', async (req, res) => {
  try {
    const { consultas } = getCollections();
    const { id } = req.params;
    const objId = toObjectId(id);

    const consulta = await consultas.findOne({
      $or: [
        ...(objId ? [{ _id: objId }] : []),
        { _id: id }
      ]
    });

    if (!consulta) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    res.json({
      success: true,
      data: consulta
    });
  } catch (error) {
    console.error('Error obteniendo consulta por id:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// GET /api/consultas/:pacienteId
router.get('/consultas/:pacienteId', async (req, res) => {
  try {
    const { consultas } = getCollections();
    const { pacienteId } = req.params;

    const query = ObjectId.isValid(pacienteId)
      ? { $or: [{ pacienteId: new ObjectId(pacienteId) }, { pacienteId: pacienteId }, { pacienteExpediente: pacienteId }] }
      : { $or: [{ pacienteId: pacienteId }, { pacienteExpediente: pacienteId }] };

    const listaConsultas = await consultas
      .find(query)
      .sort({ fecha: -1 })
      .toArray();

    res.json({
      success: true,
      data: listaConsultas
    });
  } catch (error) {
    console.error('Error obteniendo consultas:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// =====================================
// RECETAS MÉDICAS
// =====================================

// GET /api/recetas
router.get('/recetas', async (req, res) => {
  try {
    const { recetas } = getCollections();
    const { pacienteExpediente, medico } = req.query;
    const filtro = {};
    if (pacienteExpediente) filtro.pacienteExpediente = pacienteExpediente;
    if (medico) filtro.medico = medico;

    const listaRecetas = await recetas.find(filtro).sort({ fecha: -1 }).toArray();
    res.json({
      success: true,
      data: listaRecetas
    });
  } catch (error) {
    console.error('Error obteniendo recetas:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al obtener recetas' });
  }
});

// GET /api/receta/:id (Por ID de receta, por ID de consulta, o por expediente)
router.get('/receta/:id', async (req, res) => {
  try {
    const { recetas, consultas, patients } = getCollections();
    const { id } = req.params;
    const objId = toObjectId(id);

    // 1. Buscar directamente en la colección 'recetas'
    let receta = await recetas.findOne({
      $or: [
        ...(objId ? [{ _id: objId }, { consultaId: objId }] : []),
        { _id: id },
        { consultaId: id },
        { pacienteExpediente: id }
      ]
    });

    // 2. Si no existe en recetas, buscar si existe como 'consulta' y construir los datos de la receta
    if (!receta) {
      const consulta = await consultas.findOne({
        $or: [
          ...(objId ? [{ _id: objId }] : []),
          { _id: id },
          { pacienteExpediente: id }
        ]
      });

      if (consulta) {
        receta = {
          _id: consulta._id,
          consultaId: consulta._id,
          pacienteId: consulta.pacienteId || '',
          pacienteExpediente: consulta.pacienteExpediente || '',
          pacienteNombre: consulta.pacienteNombre || '',
          medico: consulta.medico || '',
          diagnosticos: consulta.diagnosticos || [],
          medicamentos: consulta.medicamentos || [],
          alergias: consulta.alergias || [],
          notas: consulta.notas || '',
          fecha: consulta.fecha || new Date()
        };
      }
    }

    if (!receta) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    res.json({
      success: true,
      data: receta
    });
  } catch (error) {
    console.error('Error obteniendo receta:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al obtener receta' });
  }
});

// PUT /api/receta/:id (Guardar o editar modificaciones a una receta)
router.put('/receta/:id', async (req, res) => {
  try {
    const { recetas } = getCollections();
    const { id } = req.params;
    const objId = toObjectId(id);

    const filtro = {
      $or: [
        ...(objId ? [{ _id: objId }, { consultaId: objId }] : []),
        { _id: id },
        { consultaId: id }
      ]
    };

    const updateData = {
      ...req.body,
      fechaActualizacion: new Date()
    };
    delete updateData._id;

    const result = await recetas.updateOne(filtro, { $set: updateData });

    res.json({
      success: true,
      message: 'Receta actualizada exitosamente',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error actualizando receta:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al actualizar receta' });
  }
});

// =====================================
// CITAS MÉDICAS
// =====================================

// GET /api/citas
router.get('/citas', async (req, res) => {
  try {
    const { citas } = getCollections();
    const { pacienteExpediente, fecha, doctor, estado } = req.query;
    const filtro = {};

    if (estado) {
      filtro.estado = estado;
    } else {
      filtro.estado = { $ne: 'Cancelada' };
    }

    if (pacienteExpediente) filtro.pacienteExpediente = pacienteExpediente;
    if (fecha) filtro.fecha = fecha;
    if (doctor) filtro.doctor = doctor;

    const listaCitas = await citas.find(filtro).sort({ fecha: 1, hora: 1 }).toArray();
    res.json({
      success: true,
      data: listaCitas
    });
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al obtener citas' });
  }
});

// GET /api/citas/paciente/:expediente
router.get('/citas/paciente/:expediente', async (req, res) => {
  try {
    const { citas } = getCollections();
    const { expediente } = req.params;

    const listaCitas = await citas
      .find({ pacienteExpediente: expediente, estado: { $ne: 'Cancelada' } })
      .sort({ fecha: 1, hora: 1 })
      .toArray();

    res.json({
      success: true,
      data: listaCitas
    });
  } catch (error) {
    console.error('Error obteniendo citas del paciente:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// GET /api/citas/doctor/:doctor
router.get('/citas/doctor/:doctor', async (req, res) => {
  try {
    const { citas } = getCollections();
    const { doctor } = req.params;

    const listaCitas = await citas
      .find({
        $or: [{ doctor: doctor }, { doctorId: doctor }],
        estado: { $ne: 'Cancelada' }
      })
      .sort({ fecha: 1, hora: 1 })
      .toArray();

    res.json({
      success: true,
      data: listaCitas
    });
  } catch (error) {
    console.error('Error obteniendo citas del doctor:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// POST /api/citas
router.post('/citas', validarCita, async (req, res) => {
  try {
    const { citas } = getCollections();
    const {
      pacienteExpediente,
      nombre,
      telefono,
      doctor,
      fecha,
      hora,
      duracionMinutos = 30
    } = req.body;

    const duracion = parseInt(duracionMinutos, 10) || 30;
    const inicioNuevo = horaAMinutos(hora);
    const finNuevo = inicioNuevo + duracion;

    const filtroSolapamiento = {
      fecha: fecha,
      estado: { $ne: 'Cancelada' }
    };

    const condiciones = [];
    if (doctor) condiciones.push({ doctor: doctor });
    if (pacienteExpediente) condiciones.push({ pacienteExpediente: pacienteExpediente });
    if (telefono) condiciones.push({ telefono: telefono.trim() });

    if (condiciones.length > 0) {
      filtroSolapamiento.$or = condiciones;
    }

    const citasMismoDia = await citas.find(filtroSolapamiento).toArray();

    for (const citaExistente of citasMismoDia) {
      const duracionExistente = citaExistente.duracionMinutos || 30;
      const inicioExistente = horaAMinutos(citaExistente.hora);
      const finExistente = inicioExistente + duracionExistente;

      const hayEmpalme = Math.max(inicioNuevo, inicioExistente) < Math.min(finNuevo, finExistente);
      if (hayEmpalme) {
        const conflictoCon = (citaExistente.pacienteExpediente && citaExistente.pacienteExpediente === pacienteExpediente)
          ? 'El paciente ya cuenta con una cita en ese horario (' + citaExistente.hora + ')'
          : 'Horario no disponible: se empalma con otra cita agendada a las ' + citaExistente.hora + ' (' + (citaExistente.especialidad || 'Cita médica') + ')';
        
        return res.status(409).json({
          success: false,
          empalme: true,
          message: conflictoCon,
          citaConflicto: {
            hora: citaExistente.hora,
            duracion: duracionExistente,
            doctor: citaExistente.doctor,
            especialidad: citaExistente.especialidad
          }
        });
      }
    }

    const nuevaCita = createCitaSchema(req.body, duracion);
    const result = await citas.insertOne(nuevaCita);

    res.status(201).json({
      success: true,
      message: 'Cita agendada exitosamente sin empalmes',
      data: {
        id: result.insertedId,
        cita: nuevaCita
      }
    });
  } catch (error) {
    console.error('Error agendando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al agendar cita'
    });
  }
});

// PATCH /api/citas/:id/cancelar
router.patch('/citas/:id/cancelar', async (req, res) => {
  try {
    const { citas } = getCollections();
    const { id } = req.params;
    const objId = toObjectId(id);

    await citas.updateOne(
      { $or: [...(objId ? [{ _id: objId }] : []), { _id: id }] },
      { $set: { estado: 'Cancelada', fechaCancelacion: new Date() } }
    );
    res.json({ success: true, message: 'Cita cancelada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelando cita' });
  }
});

// PATCH /api/citas/:id/atender
router.patch('/citas/:id/atender', async (req, res) => {
  try {
    const { citas } = getCollections();
    const { id } = req.params;
    const objId = toObjectId(id);

    await citas.updateOne(
      { $or: [...(objId ? [{ _id: objId }] : []), { _id: id }] },
      { $set: { estado: 'Atendida', fechaAtendida: new Date() } }
    );
    res.json({ success: true, message: 'Cita marcada como atendida' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error actualizando cita' });
  }
});

// GET /api/test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente'
  });
});

module.exports = router;
