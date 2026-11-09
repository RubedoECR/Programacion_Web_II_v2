// Logger sencillo: escribe en consola y en logs/app.log
// Cada línea: [fecha] [NIVEL] mensaje {datos}
const fs = require('fs');
const path = require('path');

const CARPETA_LOGS = path.join(__dirname, '..', '..', 'logs');
const ARCHIVO_LOG = path.join(CARPETA_LOGS, 'app.log');

if (!fs.existsSync(CARPETA_LOGS)) fs.mkdirSync(CARPETA_LOGS, { recursive: true });

function escribir(nivel, mensaje, datos) {
  const extra = datos && Object.keys(datos).length ? ' ' + JSON.stringify(datos) : '';
  const linea = `[${new Date().toISOString()}] [${nivel}] ${mensaje}${extra}`;

  if (nivel === 'ERROR') console.error(linea);
  else if (nivel === 'WARN') console.warn(linea);
  else console.log(linea);

  fs.appendFile(ARCHIVO_LOG, linea + '\n', () => {});
}

module.exports = {
  info: (mensaje, datos) => escribir('INFO', mensaje, datos),
  warn: (mensaje, datos) => escribir('WARN', mensaje, datos),
  error: (mensaje, datos) => escribir('ERROR', mensaje, datos),
  // Inicio y término de procesos críticos
  inicio: (proceso, datos) => escribir('INICIO', proceso, datos),
  fin: (proceso, datos) => escribir('FIN', proceso, datos),
};
