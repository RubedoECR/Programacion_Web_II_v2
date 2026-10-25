// Esquemas / Modeladores de datos para colecciones de MediVoz

const parseAlergias = (alergias) => {
  if (Array.isArray(alergias)) return alergias;
  if (typeof alergias === 'string' && alergias.trim()) {
    return alergias.split(',').map(a => a.trim()).filter(Boolean);
  }
  return [];
};

const createUserSchema = (data) => {
  const emailFinal = (data.correo || data.email || '').trim();
  const nombreFinal = (data.nombre || '').trim();
  const usuarioFinal = (data.usuario || emailFinal).trim();

  return {
    nombre: nombreFinal,
    apellidoP: (data.apellidoP || '').trim(),
    apellidoM: (data.apellidoM || '').trim(),
    especialidad: (data.especialidad || '').trim(),
    telefono: (data.telefono || '').trim(),
    fechaNacimiento: data.fechaNacimiento || '',
    email: emailFinal,
    correo: emailFinal,
    cedula: data.cedula || '',
    usuario: usuarioFinal,
    password: data.password, // En producción se recomienda bcrypt
    rol: 'medico',
    fechaRegistro: new Date()
  };
};

const createPatientSchema = (data, expediente) => {
  const nombreLimpio = (data.nombre || '').trim();
  const apellidoPLimpio = (data.apellidoP || '').trim();

  return {
    expediente,
    nombre: nombreLimpio,
    apellidoP: apellidoPLimpio,
    apellidoM: (data.apellidoM || '').trim(),
    nombreCompleto: [nombreLimpio, apellidoPLimpio, (data.apellidoM || '')].filter(Boolean).join(' '),
    fechaNacimiento: data.fechaNacimiento,
    sexo: data.sexo,
    telefono: (data.telefono || '').trim(),
    correo: (data.correo || '').trim(),
    tipoSangre: (data.tipoSangre || '').trim(),
    direccion: (data.direccion || '').trim(),
    alergias: parseAlergias(data.alergias),
    contactoEmergencia: {
      nombre: (data.contactoNombre || '').trim(),
      parentesco: (data.contactoParentesco || '').trim(),
      telefono: (data.contactoTelefono || '').trim()
    },
    estado: 'Activo',
    fechaRegistro: new Date()
  };
};

const createConsultaSchema = (data) => {
  return {
    pacienteId: data.pacienteId,
    pacienteExpediente: data.pacienteExpediente || data.paciente || '',
    pacienteNombre: data.pacienteNombre || data.pacienteTexto || '',
    medico: data.medico,
    tipoConsulta: data.tipoConsulta || '',
    categoria: data.categoria || '',
    severidad: data.severidad || '',
    presion: data.presion || '',
    frecuencia: data.frecuencia || '',
    temperatura: data.temperatura || '',
    peso: data.peso || '',
    talla: data.talla || '',
    imc: data.imc || '',
    sintomas: data.sintomas || '',
    diagnosticos: Array.isArray(data.diagnosticos) ? data.diagnosticos : [],
    medicamentos: Array.isArray(data.medicamentos) ? data.medicamentos : [],
    alergias: Array.isArray(data.alergias) ? data.alergias : [],
    notas: data.notas || '',
    fecha: data.fecha ? new Date(data.fecha) : new Date(),
    estado: 'Completada'
  };
};

const createCitaSchema = (data, duracion) => {
  return {
    pacienteExpediente: data.pacienteExpediente || '',
    nombre: (data.nombre || '').trim(),
    telefono: (data.telefono || '').trim(),
    correo: (data.correo || '').trim(),
    especialidad: data.especialidad || 'Medicina General',
    doctor: data.doctor || 'Dr. Diego Leal',
    fecha: data.fecha,
    hora: data.hora,
    duracionMinutos: duracion,
    motivo: (data.motivo || '').trim(),
    estado: 'Confirmada',
    fechaCreacion: new Date()
  };
};

module.exports = {
  createUserSchema,
  createPatientSchema,
  createConsultaSchema,
  createCitaSchema,
  parseAlergias
};
