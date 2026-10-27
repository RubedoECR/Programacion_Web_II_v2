import { createContext, useContext, useState, useEffect } from 'react';
import { obtenerDoctorPorId } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicializa con la sesión guardada en localStorage o null si no hay sesión
  const [usuario, setUsuario] = useState(() => {
    const sesionGuardada = localStorage.getItem('usuarioActual');
    if (sesionGuardada) {
      try {
        return JSON.parse(sesionGuardada);
      } catch (e) {
        console.error('Error parseando sesion de localStorage:', e);
      }
    }
    return null;
  });

  const [cargandoSesion, setCargandoSesion] = useState(false);

  // Sincronizar / revalidar datos del médico con MongoDB si hay sesión activa
  useEffect(() => {
    if (!usuario?.id) return;
    let activo = true;

    obtenerDoctorPorId(usuario.id)
      .then(res => {
        if (activo && res && res.success && res.data) {
          const docActualizado = {
            ...usuario,
            ...res.data,
            rol: usuario.rol || 'medico'
          };
          setUsuario(docActualizado);
          localStorage.setItem('usuarioActual', JSON.stringify(docActualizado));
        }
      })
      .catch(err => {
        // Si no responde o está offline, se conserva la sesión local existente
        console.warn('No se pudo revalidar sesión con MongoDB Atlas:', err.message);
      });

    return () => { activo = false; };
  }, [usuario?.id]);

  function iniciarSesion(datos, rol = 'medico') {
    const sesion = {
      id: datos.id || datos._id,
      nombre: datos.nombre || 'Doctor',
      usuario: datos.usuario || datos.email || '',
      especialidad: datos.especialidad || 'Medicina General',
      cedula: datos.cedula || '',
      email: datos.email || datos.correo || '',
      telefono: datos.telefono || '',
      rol
    };
    localStorage.setItem('usuarioActual', JSON.stringify(sesion));
    setUsuario(sesion);
  }

  function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion, cargandoSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
