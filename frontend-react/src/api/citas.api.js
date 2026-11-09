import { peticion, queryString } from './cliente';

// filtros: { fecha, medico, paciente, estado, incluirCanceladas }
export const obtenerCitas = (filtros) => peticion('GET', `/citas${queryString(filtros)}`);
export const obtenerCita = (id) => peticion('GET', `/citas/${id}`);
export const agendarCita = (datos) => peticion('POST', '/citas', datos);
export const actualizarCita = (id, datos) => peticion('PUT', `/citas/${id}`, datos);
export const cancelarCita = (id) => peticion('PATCH', `/citas/${id}/cancelar`);
export const eliminarCita = (id) => peticion('DELETE', `/citas/${id}`);
