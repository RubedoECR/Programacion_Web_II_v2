import { peticion, queryString } from './cliente';

export const obtenerRecetas = (filtros) => peticion('GET', `/recetas${queryString(filtros)}`);
export const obtenerReceta = (id) => peticion('GET', `/recetas/${id}`);
export const crearReceta = (datos) => peticion('POST', '/recetas', datos);
export const actualizarReceta = (id, datos) => peticion('PUT', `/recetas/${id}`, datos);
export const eliminarReceta = (id) => peticion('DELETE', `/recetas/${id}`);
