// Horarios de consulta: bloques de 30 minutos de 08:00 a 14:30.
const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
];

// Fecha de hoy en formato AAAA-MM-DD
function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return hoy.getFullYear() + '-' + mes + '-' + dia;
}

// Hora actual en formato HH:mm
function horaActual() {
  const ahora = new Date();
  return String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
}

module.exports = { HORARIOS, fechaDeHoy, horaActual };
