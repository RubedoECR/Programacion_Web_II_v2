import { peticion } from './cliente';

export const login = (usuario, password) => peticion('POST', '/auth/login', { usuario, password });
export const registrarDoctor = (datos) => peticion('POST', '/auth/registro', datos);
export const obtenerPerfil = () => peticion('GET', '/auth/perfil');
