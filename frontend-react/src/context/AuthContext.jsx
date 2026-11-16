import { useEffect, useState } from 'react';
import { AuthContexto } from './authContexto';
import { leerSesion, guardarSesion, borrarSesion } from '../api/cliente';

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion());

  useEffect(() => {
    const alExpirar = () => setSesion(null);
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);

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
