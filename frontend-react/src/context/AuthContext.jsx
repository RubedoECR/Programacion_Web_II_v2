// Sesión del usuario: guarda el token JWT, el tipo de usuario (medico / paciente) y sus datos.
// Si no hay sesión, usuario = null y las rutas protegidas mandan al login.
import { useEffect, useState } from 'react';
import { AuthContexto } from './authContexto';
import { leerSesion, guardarSesion, borrarSesion } from '../api/cliente';

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion());

  // Si el backend responde 401 en cualquier petición, se cierra la sesión
  useEffect(() => {
    const alExpirar = () => setSesion(null);
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);

  // datos = { token, rol, usuario }  (lo que responde el login)
  function iniciarSesion(datos) {
    guardarSesion(datos);
    setSesion(datos);
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
    usuario: sesion ? sesion.usuario : null,
    rol: sesion ? sesion.rol : null,
    token: sesion ? sesion.token : null,
    iniciarSesion,
    actualizarUsuario,
    cerrarSesion,
  };

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}
