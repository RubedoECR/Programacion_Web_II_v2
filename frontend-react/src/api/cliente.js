// Cliente HTTP base: todas las peticiones al backend pasan por aquí.
// - Agrega el token JWT en el header Authorization
// - Envía y recibe JSON
// - Si el backend responde 401 (token vencido o inválido), cierra la sesión
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CLAVE_SESION = 'medivoz_sesion';

export function leerSesion() {
  let sesion = null;
  try {
    sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    sesion = null;
  }

  // Una sesión guardada con la versión anterior no trae el rol: se descarta y se pide login de nuevo
  if (!sesion || !sesion.token || (sesion.rol !== 'medico' && sesion.rol !== 'paciente')) {
    localStorage.removeItem(CLAVE_SESION);
    return null;
  }
  return sesion;
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

  // Si el servidor no contesta en 15 s, se cancela la petición para no dejar la pantalla esperando
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 15000);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    });
  } catch (error) {
    const mensaje =
      error.name === 'AbortError'
        ? 'El servidor no respondió a tiempo. Revisa que el backend esté funcionando.'
        : 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
    return { success: false, message: mensaje };
  } finally {
    clearTimeout(temporizador);
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
