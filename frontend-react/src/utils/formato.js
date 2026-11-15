export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fechaCorta(valor, { utc = false } = {}) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-MX', utc ? { timeZone: 'UTC' } : undefined);
}

export const fechaInput = (valor) => (valor ? String(valor).slice(0, 10) : '');

export function nombreCompleto(persona) {
  if (!persona) return '';
  return persona.nombreCompleto || [persona.nombre, persona.apellidoP, persona.apellidoM].filter(Boolean).join(' ');
}

export function nombreMedico(medico) {
  const nombre = nombreCompleto(medico);
  return nombre ? `Dr. ${nombre}` : '—';
}

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

export function pacienteAFormulario(p) {
  return {
    correo: '',
    password: '',
    confirmarPassword: '',
    nombre: p.nombre || '',
    apellidoP: p.apellidoP || '',
    apellidoM: p.apellidoM || '',
    fechaNacimiento: fechaInput(p.fechaNacimiento),
    sexo: p.sexo || '',
    telefono: p.telefono || '',
    tipoSangre: p.tipoSangre || '',
    direccion: p.direccion || '',
    alergias: (p.alergias || []).join(', '),
    contactoNombre: p.contactoEmergencia ? p.contactoEmergencia.nombre : '',
    contactoParentesco: p.contactoEmergencia ? p.contactoEmergencia.parentesco : '',
    contactoTelefono: p.contactoEmergencia ? p.contactoEmergencia.telefono : '',
    estado: p.estado || 'Activo',
  };
}
