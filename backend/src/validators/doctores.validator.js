// Validaciones de backend para la tabla de médicos (usuarios).
const c = require('./comunes');

// PUT /doctores/:id
function actualizar(req) {
  const datos = req.body;
  const errores = c.idEnUrl(req);

  if (datos.nombre !== undefined && c.estaVacio(datos.nombre)) errores.push('El nombre no puede quedar vacío');
  if (datos.email !== undefined && !c.esCorreo(datos.email)) errores.push('El correo no es válido');
  if (!c.estaVacio(datos.telefono) && !c.esTelefono(datos.telefono)) {
    errores.push('El teléfono debe tener al menos 10 dígitos');
  }
  // La contraseña solo se revisa si se quiere cambiar
  if (!c.estaVacio(datos.password) && !c.esPasswordValida(datos.password)) errores.push(c.MENSAJE_PASSWORD);

  return errores;
}

module.exports = { actualizar, obtener: c.idEnUrl, eliminar: c.idEnUrl };
