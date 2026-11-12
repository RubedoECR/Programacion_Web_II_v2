import { peticion } from './cliente';

// Médicos
export const loginMedico = (correo, password) => peticion('POST', '/auth/medico/login', { correo, password });
export const registrarMedico = (datos) => peticion('POST', '/auth/medico/registro', datos);

// Pacientes
export const loginPaciente = (correo, password) => peticion('POST', '/auth/paciente/login', { correo, password });
export const registrarPaciente = (datos) => peticion('POST', '/auth/paciente/registro', datos);

// Usuario en sesión (médico o paciente)
export const obtenerPerfil = () => peticion('GET', '/auth/perfil');
