// Envuelve las rutas privadas.
//  - Sin sesión → al login
//  - Con sesión de otro tipo (ej. paciente entrando a una página de médico) → a su página de inicio
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { INICIO } from '../utils/rutas';

export default function RutaProtegida({ rol }) {
  const sesion = useAuth();

  if (!sesion.usuario) {
    return <Navigate to="/login" replace />;
  }
  if (sesion.rol !== rol) {
    return <Navigate to={INICIO[sesion.rol] || '/login'} replace />;
  }
  return <Outlet />;
}
