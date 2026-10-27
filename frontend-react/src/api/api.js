const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// --- AUTENTICACIÓN Y DOCTORES ---
export async function login(usuario, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  });
  return res.json();
}

export async function registrarDoctor(doctorData) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorData),
  });
  return res.json();
}

export async function obtenerDoctores() {
  const res = await fetch(`${API_URL}/doctores`);
  return res.json();
}

export async function obtenerDoctorPorId(id) {
  const res = await fetch(`${API_URL}/doctores/${id}`);
  return res.json();
}

// --- PACIENTES ---
export async function registrarPaciente(pacienteData) {
  const res = await fetch(`${API_URL}/paciente/registrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pacienteData),
  });
  return res.json();
}

export async function obtenerPacientes() {
  const res = await fetch(`${API_URL}/pacientes`);
  return res.json();
}

export async function obtenerPacientePorId(identificador) {
  const res = await fetch(`${API_URL}/pacientes/${identificador}`);
  return res.json();
}

// --- CITAS ---
export async function agendarCita(citaData) {
  const res = await fetch(`${API_URL}/citas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(citaData),
  });
  return res.json();
}

export async function obtenerCitas(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_URL}/citas?${query}` : `${API_URL}/citas`;
  const res = await fetch(url);
  return res.json();
}

export async function obtenerCitasPorPaciente(expediente) {
  const res = await fetch(`${API_URL}/citas/paciente/${expediente}`);
  return res.json();
}

export async function obtenerCitasPorDoctor(doctor) {
  const res = await fetch(`${API_URL}/citas/doctor/${encodeURIComponent(doctor)}`);
  return res.json();
}

export async function cancelarCita(id) {
  const res = await fetch(`${API_URL}/citas/${id}/cancelar`, {
    method: 'PATCH',
  });
  return res.json();
}

export async function atenderCita(id) {
  const res = await fetch(`${API_URL}/citas/${id}/atender`, {
    method: 'PATCH',
  });
  return res.json();
}

// --- CONSULTAS ---
export async function guardarConsulta(consultaData) {
  const res = await fetch(`${API_URL}/consulta/guardar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consultaData),
  });
  return res.json();
}

export async function obtenerConsultaPorId(id) {
  const res = await fetch(`${API_URL}/consulta/${id}`);
  return res.json();
}

export async function obtenerConsultasPorPaciente(pacienteId) {
  const res = await fetch(`${API_URL}/consultas/${pacienteId}`);
  return res.json();
}

// --- RECETAS ---
export async function obtenerRecetas(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_URL}/recetas?${query}` : `${API_URL}/recetas`;
  const res = await fetch(url);
  return res.json();
}

export async function obtenerRecetaPorId(id) {
  const res = await fetch(`${API_URL}/receta/${id}`);
  return res.json();
}

export async function actualizarReceta(id, recetaData) {
  const res = await fetch(`${API_URL}/receta/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recetaData),
  });
  return res.json();
}
