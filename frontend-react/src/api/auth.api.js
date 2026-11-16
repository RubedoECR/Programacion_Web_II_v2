import { peticion } from './cliente';

export const loginMedico = (correo, password) => peticion('POST', '/auth/medico/login', { correo, password });
export const registrarMedico = (datos) => peticion('POST', '/auth/medico/registro', datos);

export const loginPaciente = (correo, password) => peticion('POST', '/auth/paciente/login', { correo, password });
export const registrarPaciente = (datos) => peticion('POST', '/auth/paciente/registro', datos);

export const obtenerPerfil = () => peticion('GET', '/auth/perfil');
