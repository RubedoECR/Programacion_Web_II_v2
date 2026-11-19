const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
];

const ZONA_CLINICA = process.env.CLINIC_TZ || 'America/Monterrey';

function partesAhora() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_CLINICA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const mapa = {};
  for (const p of partes) mapa[p.type] = p.value;
  if (mapa.hour === '24') mapa.hour = '00';
  return mapa;
}

function fechaDeHoy() {
  const { year, month, day } = partesAhora();
  return `${year}-${month}-${day}`;
}

function horaActual() {
  const { hour, minute } = partesAhora();
  return `${hour}:${minute}`;
}

function fechaEnZona(fechaISO, finDeDia = false) {
  const hora = finDeDia ? '23:59:59.999' : '00:00:00.000';
  const baseUtc = new Date(`${fechaISO}T${hora}Z`);
  const localEnZona = new Date(baseUtc.toLocaleString('en-US', { timeZone: ZONA_CLINICA }));
  const utcSinZona = new Date(baseUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(baseUtc.getTime() + (utcSinZona - localEnZona));
}

module.exports = { HORARIOS, ZONA_CLINICA, fechaDeHoy, horaActual, fechaEnZona };
