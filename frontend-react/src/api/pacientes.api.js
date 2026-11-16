import { peticion, queryString } from './cliente';

export const obtenerPacientes = (filtros) => peticion('GET', `/pacientes${queryString(filtros)}`);
export const obtenerPaciente = (id) => peticion('GET', `/pacientes/${encodeURIComponent(id)}`);
export const actualizarPaciente = (id, datos) => peticion('PUT', `/pacientes/${id}`, datos);
export const eliminarPaciente = (id) => peticion('DELETE', `/pacientes/${id}`);
