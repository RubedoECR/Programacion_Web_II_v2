// Cliente HTTP base: todas las peticiones al backend pasan por aquí.
// - Agrega el token JWT en el header Authorization
// - Envía y recibe JSON
// - Si el backend responde 401 (token vencido o inválido), cierra la sesión
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CLAVE_SESION = 'medivoz_sesion';

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION)) || null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

export async function peticion(metodo, ruta, cuerpo) {
  const token = leerSesion()?.token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    return { success: false, message: 'No se pudo conectar con el servidor. ¿Está encendido el backend?' };
  }

  const datos = await respuesta.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor' }));

  if (respuesta.status === 401 && token) {
    borrarSesion();
    window.dispatchEvent(new Event('sesion-expirada'));
  }

  return datos;
}

// Convierte { fecha: '2026-11-08', medico: '' } en "?fecha=2026-11-08" (omite vacíos)
export function queryString(params = {}) {
  const limpio = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const qs = new URLSearchParams(limpio).toString();
  return qs ? `?${qs}` : '';
}
