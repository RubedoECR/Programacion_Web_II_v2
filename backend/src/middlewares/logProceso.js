const logger = require('../utils/logger');

function logProceso(nombreProceso) {
  return (req, res, next) => {
    const usuario = req.usuario ? req.usuario.id : 'sin sesión';
    logger.inicio(nombreProceso, { usuario: usuario });

    res.on('finish', () => {
      logger.fin(nombreProceso, { usuario: usuario, status: res.statusCode });
    });

    next();
  };
}

module.exports = logProceso;
