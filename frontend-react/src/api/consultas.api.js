import { peticion, queryString } from './cliente';

// filtros: { paciente, medico }
export const obtenerConsultas = (filtros) => peticion('GET', `/consultas${queryString(filtros)}`);
export const obtenerConsulta = (id) => peticion('GET', `/consultas/${id}`);
// Responde { consulta, receta }
export const guardarConsulta = (datos) => peticion('POST', '/consultas', datos);
export const actualizarConsulta = (id, datos) => peticion('PUT', `/consultas/${id}`, datos);
export const eliminarConsulta = (id) => peticion('DELETE', `/consultas/${id}`);
