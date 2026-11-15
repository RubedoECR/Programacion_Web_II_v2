const logger = require('../utils/logger');

function rutaNoEncontrada(req, res) {
  res.status(404).json({ success: false, message: 'Ruta no encontrada: ' + req.method + ' ' + req.originalUrl });
}

function manejadorErrores(error, req, res, next) {
  if (error.name === 'ValidationError') {
    const primerError = Object.values(error.errors)[0];
    logger.warn('Datos rechazados por el modelo', { ruta: req.originalUrl, error: primerError.message });
    return res.status(400).json({ success: false, message: primerError.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'El ID no es válido' });
  }

  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos' });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es un JSON válido' });
  }

  logger.error('Excepción en el servidor', { metodo: req.method, ruta: req.originalUrl, error: error.message, stack: error.stack });
  res.status(500).json({ success: false, message: 'Error en el servidor' });
}

module.exports = { rutaNoEncontrada, manejadorErrores };
