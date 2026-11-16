import { useContext } from 'react';
import { AuthContexto } from './authContexto';

export const useAuth = () => useContext(AuthContexto);
