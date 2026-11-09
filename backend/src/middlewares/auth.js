// Verifica el token JWT que se envía en el header:  Authorization: Bearer <token>
// Si es válido, deja los datos del médico en req.usuario.
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const logger = require('../utils/logger');

async function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Token de autorización requerido' });
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);

    // El usuario del token debe seguir existiendo y estar activo
    const usuario = await Usuario.findById(datos.id).lean();
    if (!usuario || usuario.activo === false) {
      return res.status(401).json({ success: false, message: 'La sesión ya no es válida' });
    }

    req.usuario = { id: String(usuario._id), nombre: usuario.nombre, rol: usuario.rol };
    next();
  } catch (error) {
    logger.warn('Token rechazado', { ruta: req.originalUrl, motivo: error.message });
    const mensaje = error.name === 'TokenExpiredError' ? 'La sesión expiró, inicia sesión de nuevo' : 'Token inválido';
    return res.status(401).json({ success: false, message: mensaje });
  }
}

module.exports = { verificarToken };
