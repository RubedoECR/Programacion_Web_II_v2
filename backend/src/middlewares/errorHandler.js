// Manejo de errores: los controladores mandan aquí cualquier excepción con next(error).
// Todo queda registrado en logs/app.log
const logger = require('../utils/logger');

function rutaNoEncontrada(req, res) {
  res.status(404).json({ success: false, message: 'Ruta no encontrada: ' + req.method + ' ' + req.originalUrl });
}

// Express reconoce un manejador de errores porque recibe 4 parámetros
// eslint-disable-next-line no-unused-vars
function manejadorErrores(error, req, res, next) {
  // Errores de validación del modelo de Mongoose
  if (error.name === 'ValidationError') {
    const primerError = Object.values(error.errors)[0];
    logger.warn('Datos rechazados por el modelo', { ruta: req.originalUrl, error: primerError.message });
    return res.status(400).json({ success: false, message: primerError.message });
  }

  // ID con formato incorrecto
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'El ID no es válido' });
  }

  // Registro duplicado (índice unique)
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos' });
  }

  // JSON mal escrito en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Cualquier otro error: 500
  logger.error('Excepción en el servidor', { metodo: req.method, ruta: req.originalUrl, error: error.message, stack: error.stack });
  res.status(500).json({ success: false, message: 'Error en el servidor' });
}

module.exports = { rutaNoEncontrada, manejadorErrores };
