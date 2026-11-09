// Registra en el log el inicio y el término de un proceso crítico (crear, actualizar, borrar).
// Uso en una ruta:  router.post('/', logProceso('Registrar paciente'), ...)
const logger = require('../utils/logger');

function logProceso(nombre) {
  return (req, res, next) => {
    const inicio = Date.now();
    const datos = { usuario: req.usuario?.id, id: req.params.id };

    logger.inicio(nombre, datos);
    res.on('finish', () => {
      logger.fin(nombre, { ...datos, status: res.statusCode, ms: Date.now() - inicio });
    });
    next();
  };
}

module.exports = logProceso;
