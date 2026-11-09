// Funciones de formato reutilizables en varias páginas.

// Fecha de hoy en formato AAAA-MM-DD (hora local)
export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2000-05-05T00:00:00.000Z" → "05/05/2000"
// Las fechas sin hora (nacimiento) se guardan a medianoche UTC; se leen en UTC para no restar un día.
export function fechaCorta(valor, { utc = false } = {}) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-MX', utc ? { timeZone: 'UTC' } : undefined);
}

// "2000-05-05T00:00:00.000Z" → "2000-05-05"  (para inputs type="date")
export const fechaInput = (valor) => (valor ? String(valor).slice(0, 10) : '');

export function nombreCompleto(persona) {
  if (!persona) return '';
  return persona.nombreCompleto || [persona.nombre, persona.apellidoP, persona.apellidoM].filter(Boolean).join(' ');
}

export function nombreMedico(medico) {
  const nombre = nombreCompleto(medico);
  return nombre ? `Dr. ${nombre}` : '—';
}

// Paciente del API → forma "plana" que usan las tablas y tarjetas
export function adaptarPaciente(p) {
  return {
    _id: p._id,
    expediente: p.expediente,
    nombre: nombreCompleto(p),
    edad: p.edad ?? '—',
    fechaNacimiento: p.fechaNacimiento || '',
    sexo: p.sexo || 'Otro',
    tipoSangre: p.tipoSangre || '—',
    telefono: p.telefono || '—',
    correo: p.correo || '',
    direccion: p.direccion || '',
    alergias: Array.isArray(p.alergias) ? p.alergias : [],
    contactoEmergencia: p.contactoEmergencia || {},
    estado: p.estado || 'Activo',
    fechaRegistro: p.createdAt || '',
  };
}
