// Sesión del médico: guarda el token JWT y los datos reales del usuario que inició sesión.
// Si no hay sesión, usuario = null y las rutas protegidas redirigen a /login.
import { useEffect, useState } from 'react';
import { AuthContexto } from './authContexto';
import { leerSesion, guardarSesion, borrarSesion } from '../api/cliente';

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion());

  // Si el backend responde 401 en cualquier petición, se cierra la sesión
  useEffect(() => {
    const alExpirar = () => setSesion(null);
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);

  function iniciarSesion({ token, usuario }) {
    const nueva = { token, usuario };
    guardarSesion(nueva);
    setSesion(nueva);
  }

  function actualizarUsuario(usuario) {
    const nueva = { ...sesion, usuario };
    guardarSesion(nueva);
    setSesion(nueva);
  }

  function cerrarSesion() {
    borrarSesion();
    setSesion(null);
  }

  const valor = {
    usuario: sesion?.usuario || null,
    token: sesion?.token || null,
    iniciarSesion,
    actualizarUsuario,
    cerrarSesion,
  };

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}
