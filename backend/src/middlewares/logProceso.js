// Registra en el log el inicio y el término de un proceso crítico (crear, actualizar, borrar).
// Uso en una ruta:  router.post('/', logProceso('Registrar paciente'), ...)
const logger = require('../utils/logger');

function logProceso(nombreProceso) {
  return (req, res, next) => {
    const usuario = req.usuario ? req.usuario.id : 'sin sesión';
    logger.inicio(nombreProceso, { usuario: usuario });

    // 'finish' se dispara cuando ya se mandó la respuesta
    res.on('finish', () => {
      logger.fin(nombreProceso, { usuario: usuario, status: res.statusCode });
    });

    next();
  };
}

module.exports = logProceso;
