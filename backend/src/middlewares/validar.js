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
