// Middleware que ejecuta una función de validación (de la carpeta validators).
// La función recibe req y regresa una lista de errores; si la lista no está vacía se responde 400.
//
// Uso en una ruta:  router.post('/', validar(v.crear), ctrl.crear)
function validar(funcionValidadora) {
  return (req, res, next) => {
    const errores = funcionValidadora(req);

    if (errores.length > 0) {
      return res.status(400).json({ success: false, message: errores[0], errores });
    }
    next();
  };
}

module.exports = validar;
