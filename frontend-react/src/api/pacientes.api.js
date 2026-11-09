import { peticion, queryString } from './cliente';

export const obtenerPacientes = (filtros) => peticion('GET', `/pacientes${queryString(filtros)}`);
// id puede ser el _id de Mongo o el expediente (EXP-000001)
export const obtenerPaciente = (id) => peticion('GET', `/pacientes/${encodeURIComponent(id)}`);
export const registrarPaciente = (datos) => peticion('POST', '/pacientes', datos);
export const actualizarPaciente = (id, datos) => peticion('PUT', `/pacientes/${id}`, datos);
export const eliminarPaciente = (id) => peticion('DELETE', `/pacientes/${id}`);
