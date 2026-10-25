import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const sesionGuardada = localStorage.getItem('usuarioActual');
    if (sesionGuardada) {
      try {
        return JSON.parse(sesionGuardada);
      } catch (e) {
        // Ignorar error de parsing
      }
    }
    // Sesión médica activa por defecto para navegación inmediata y soporte de atajos
    return {
      id: 'doc-diego-leal',
      nombre: 'Dr. Diego Leal',
      usuario: 'diego.leal@medivoz.com',
      especialidad: 'Medicina General',
      rol: 'medico'
    };
  });

  function iniciarSesion(datos, rol = 'medico') {
    const sesion = { ...datos, rol };
    localStorage.setItem('usuarioActual', JSON.stringify(sesion));
    setUsuario(sesion);
  }

  function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
