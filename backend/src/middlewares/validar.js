// Ejecuta las reglas de un validador (express-validator) y responde 400 si algo falla.
const { validationResult } = require('express-validator');

function validar(reglas) {
  return [
    ...reglas,
    (req, res, next) => {
      const resultado = validationResult(req);
      if (resultado.isEmpty()) return next();

      const errores = resultado.array().map((e) => ({ campo: e.path, mensaje: e.msg }));
      return res.status(400).json({
        success: false,
        message: errores[0].mensaje,
        errores,
      });
    },
  ];
}

module.exports = validar;
