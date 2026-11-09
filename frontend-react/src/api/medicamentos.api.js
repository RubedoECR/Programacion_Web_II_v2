import { peticion } from './cliente';

export const obtenerMedicamentos = (soloActivos = false) =>
  peticion('GET', `/medicamentos${soloActivos ? '?activos=true' : ''}`);
export const obtenerMedicamento = (id) => peticion('GET', `/medicamentos/${id}`);
export const crearMedicamento = (datos) => peticion('POST', '/medicamentos', datos);
export const actualizarMedicamento = (id, datos) => peticion('PUT', `/medicamentos/${id}`, datos);
export const eliminarMedicamento = (id) => peticion('DELETE', `/medicamentos/${id}`);
