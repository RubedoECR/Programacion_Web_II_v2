// Controlador de pacientes (lado del médico).
// El alta la hace el propio paciente en /api/auth/paciente/registro.
const Paciente = require('../models/Paciente');
const Consulta = require('../models/Consulta');
const Cita = require('../models/Cita');

// Arma el objeto con los campos que se pueden guardar (solo los que vienen en el body)
function datosDelPaciente(body) {
  const datos = {};
  const campos = ['nombre', 'apellidoP', 'apellidoM', 'fechaNacimiento', 'sexo', 'telefono', 'tipoSangre', 'direccion', 'estado'];

  for (const campo of campos) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }

  // Las alergias pueden venir como texto "Polen, Látex" o como lista
  if (body.alergias !== undefined) {
    if (Array.isArray(body.alergias)) {
      datos.alergias = body.alergias;
    } else {
      datos.alergias = String(body.alergias).split(',').map((a) => a.trim()).filter((a) => a !== '');
    }
  }

  // El formulario manda el contacto de emergencia en 3 campos separados
  if (body.contactoNombre !== undefined || body.contactoParentesco !== undefined || body.contactoTelefono !== undefined) {
    datos.contactoEmergencia = {
      nombre: body.contactoNombre || '',
      parentesco: body.contactoParentesco || '',
      telefono: body.contactoTelefono || '',
    };
  }

  return datos;
}

// Genera el siguiente número de expediente: EXP-000001, EXP-000002, ...
async function siguienteExpediente() {
  const ultimo = await Paciente.findOne().sort({ expediente: -1 });
  let numero = 1;
  if (ultimo && ultimo.expediente) {
    numero = parseInt(ultimo.expediente.replace('EXP-', ''), 10) + 1;
  }
  return 'EXP-' + String(numero).padStart(6, '0');
}

// GET /api/pacientes?buscar=texto&estado=Activo
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.estado === 'Activo' || req.query.estado === 'Inactivo') {
      filtro.estado = req.query.estado;
    }

    let pacientes = await Paciente.find(filtro).sort({ expediente: -1 });

    // Búsqueda sencilla por nombre, expediente o teléfono
    if (req.query.buscar) {
      const texto = String(req.query.buscar).toLowerCase();
      pacientes = pacientes.filter(
        (p) =>
          p.nombreCompleto.toLowerCase().includes(texto) ||
          p.expediente.toLowerCase().includes(texto) ||
          p.telefono.includes(texto)
      );
    }

    res.json({ success: true, data: pacientes });
  } catch (error) {
    next(error);
  }
}

// GET /api/pacientes/:id   (acepta el _id o el expediente)
async function obtener(req, res, next) {
  try {
    let paciente;
    if (req.params.id.startsWith('EXP-')) {
      paciente = await Paciente.findOne({ expediente: req.params.id });
    } else {
      paciente = await Paciente.findById(req.params.id);
    }

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    res.json({ success: true, data: paciente });
  } catch (error) {
    next(error);
  }
}

// PUT /api/pacientes/:id
async function actualizar(req, res, next) {
  try {
    const paciente = await Paciente.findByIdAndUpdate(req.params.id, datosDelPaciente(req.body), {
      new: true,
      runValidators: true,
    });

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    res.json({ success: true, message: 'Paciente actualizado', data: paciente });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/pacientes/:id
async function eliminar(req, res, next) {
  try {
    const id = req.params.id;

    // No se borra un paciente con historial clínico
    const tieneConsultas = await Consulta.findOne({ paciente: id });
    if (tieneConsultas) {
      return res.status(409).json({
        success: false,
        message: 'El paciente tiene consultas registradas; márcalo como Inactivo en lugar de eliminarlo',
      });
    }

    const paciente = await Paciente.findByIdAndDelete(id);
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    await Cita.deleteMany({ paciente: id });
    res.json({ success: true, message: 'Paciente eliminado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, actualizar, eliminar, datosDelPaciente, siguienteExpediente };
