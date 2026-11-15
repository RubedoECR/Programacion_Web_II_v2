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
