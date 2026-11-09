import { peticion, queryString } from './cliente';

// rango: { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD' }
export const obtenerResumen = () => peticion('GET', '/reportes/resumen');
export const reporteConsultasPorMedico = (rango) => peticion('GET', `/reportes/consultas-por-medico${queryString(rango)}`);
export const reporteAsistenciaCitas = (rango) => peticion('GET', `/reportes/asistencia-citas${queryString(rango)}`);
export const reporteDiagnosticos = (rango) => peticion('GET', `/reportes/diagnosticos-frecuentes${queryString(rango)}`);
export const reporteMedicamentos = (rango) => peticion('GET', `/reportes/medicamentos-mas-recetados${queryString(rango)}`);
export const reportePacientesFrecuentes = (rango) => peticion('GET', `/reportes/pacientes-frecuentes${queryString(rango)}`);
