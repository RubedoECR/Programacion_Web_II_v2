// Punto de entrada: carga la configuración, conecta a MongoDB y levanta el servidor.
require('dotenv').config();

const app = require('./src/app');
const { conectarDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  logger.error('Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

async function iniciar() {
  logger.inicio('Arranque del servidor');
  try {
    await conectarDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      logger.fin('Arranque del servidor', { puerto: PORT });
      console.log(`\n🚀 API de MediVoz en http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    logger.error('No se pudo iniciar el servidor', { error: error.message });
    process.exit(1);
  }
}

// Excepciones no controladas: se registran en el log antes de terminar
process.on('unhandledRejection', (razon) => {
  logger.error('Promesa rechazada sin manejar', { error: String(razon) });
});
process.on('uncaughtException', (error) => {
  logger.error('Excepción no controlada', { error: error.message, stack: error.stack });
  process.exit(1);
});

iniciar();
