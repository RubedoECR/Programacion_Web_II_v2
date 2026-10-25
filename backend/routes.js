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

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        id: user._id,
        nombre: user.nombre,
        usuario: user.usuario,
        especialidad: user.especialidad,
        email: user.email
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
        especialidad: newUser.especialidad
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
        cedula: d.cedula || ''
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

// =====================================
// CONSULTAS
// =====================================

// POST /api/consulta/guardar
router.post('/consulta/guardar', validarConsulta, async (req, res) => {
  try {
    const { consultas } = getCollections();
    const newConsulta = createConsultaSchema(req.body);
    const result = await consultas.insertOne(newConsulta);

    res.status(201).json({
      success: true,
      message: 'Consulta guardada exitosamente',
      data: {
        id: result.insertedId
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
// CITAS MÉDICAS
// =====================================

// GET /api/citas
router.get('/citas', async (req, res) => {
  try {
    const { citas } = getCollections();
    const { pacienteExpediente, fecha, doctor } = req.query;
    const filtro = { estado: { $ne: 'Cancelada' } };

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

    await citas.updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'Cancelada', fechaCancelacion: new Date() } }
    );
    res.json({ success: true, message: 'Cita cancelada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelando cita' });
  }
});

// GET /api/test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: ' Servidor funcionando correctamente'
  });
});

module.exports = router;
