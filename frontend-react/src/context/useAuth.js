import { useContext } from 'react';
import { AuthContexto } from './authContexto';

// Hook para leer la sesión: const { usuario, cerrarSesion } = useAuth();
export const useAuth = () => useContext(AuthContexto);
