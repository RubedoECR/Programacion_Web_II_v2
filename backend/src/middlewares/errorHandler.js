// Manejo centralizado de errores: toda excepción termina aquí y se registra en logs/app.log
const logger = require('../utils/logger');

function rutaNoEncontrada(req, res) {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Error en el servidor';
  let extra = err.extra || {};

  // Errores conocidos de Mongoose / MongoDB
  if (err.name === 'ValidationError') {
    status = 400;
    const errores = Object.values(err.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
    message = errores[0]?.mensaje || 'Datos inválidos';
    extra = { errores };
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Valor inválido para ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const campo = Object.keys(err.keyValue || {})[0] || 'campo';
    message = `Ya existe un registro con ese ${campo}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la petición no es un JSON válido';
  }

  const datosLog = { metodo: req.method, ruta: req.originalUrl, status, error: err.message };
  if (status >= 500) {
    logger.error('Excepción en el servidor', { ...datosLog, stack: err.stack });
    message = 'Error en el servidor';
  } else {
    logger.warn('Petición rechazada', datosLog);
  }

  res.status(status).json({ success: false, message, ...extra });
}

module.exports = { rutaNoEncontrada, manejadorErrores };
