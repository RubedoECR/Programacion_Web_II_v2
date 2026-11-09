// Conexión a MongoDB mediante Mongoose (ODM/ORM).
const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function conectarDB(uri) {
  if (!uri) throw new Error('Falta MONGODB_URI en el archivo .env');

  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => logger.warn('Se perdió la conexión con MongoDB'));
  mongoose.connection.on('reconnected', () => logger.info('Conexión con MongoDB restablecida'));
  mongoose.connection.on('error', (err) => logger.error('Error de MongoDB', { error: err.message }));

  logger.inicio('Conexión a MongoDB');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.fin('Conexión a MongoDB', { baseDeDatos: mongoose.connection.name });
}

module.exports = { conectarDB };
