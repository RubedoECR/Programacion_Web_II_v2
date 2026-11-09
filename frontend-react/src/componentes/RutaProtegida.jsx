// Envuelve las rutas privadas: si no hay sesión, manda a /login.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function RutaProtegida() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  return <Outlet />;
}
