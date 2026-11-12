import { peticion, queryString } from './cliente';

// Médicos y pacientes
export const obtenerDisponibles = (medico, fecha) => peticion('GET', `/citas/disponibles${queryString({ medico, fecha })}`);
export const agendarCita = (datos) => peticion('POST', '/citas', datos);
export const cancelarCita = (id) => peticion('PATCH', `/citas/${id}/cancelar`);

// Solo pacientes
export const obtenerMisCitas = () => peticion('GET', '/citas/mias');

// Solo médicos.  filtros: { fecha, medico, paciente, estado }
export const obtenerCitas = (filtros) => peticion('GET', `/citas${queryString(filtros)}`);
export const obtenerCita = (id) => peticion('GET', `/citas/${id}`);
export const reprogramarCita = (id, fecha, hora) => peticion('PUT', `/citas/${id}`, { fecha, hora });
export const eliminarCita = (id) => peticion('DELETE', `/citas/${id}`);
