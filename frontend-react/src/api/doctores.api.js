import { peticion } from './cliente';

export const obtenerDoctores = () => peticion('GET', '/doctores');
export const obtenerDoctor = (id) => peticion('GET', `/doctores/${id}`);
export const actualizarDoctor = (id, datos) => peticion('PUT', `/doctores/${id}`, datos);
export const eliminarDoctor = (id) => peticion('DELETE', `/doctores/${id}`);
