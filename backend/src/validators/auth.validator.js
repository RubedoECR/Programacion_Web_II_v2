// Validaciones de backend para login y registro (médicos y pacientes).
const c = require('./comunes');
const { revisarDatos } = require('./pacientes.validator');

// POST /auth/medico/login  y  POST /auth/paciente/login
function login(req) {
  const errores = [];
  if (c.estaVacio(req.body.correo)) errores.push('El correo es obligatorio');
  if (c.estaVacio(req.body.password)) errores.push('La contraseña es obligatoria');
  return errores;
}

// POST /auth/medico/registro
function registroMedico(req) {
  const datos = req.body;
  const errores = [];

  if (c.estaVacio(datos.nombre)) errores.push('El nombre es obligatorio');
  if (c.estaVacio(datos.email)) errores.push('El correo es obligatorio');
  else if (!c.esCorreo(datos.email)) errores.push('El correo no es válido');
  if (!c.esPasswordValida(datos.password)) errores.push(c.MENSAJE_PASSWORD);
  if (!c.estaVacio(datos.telefono) && !c.esTelefono(datos.telefono)) {
    errores.push('El teléfono debe tener al menos 10 dígitos');
  }
  if (!c.estaVacio(datos.fechaNacimiento)) {
    if (!c.esFecha(datos.fechaNacimiento)) errores.push('La fecha de nacimiento no es válida');
    else if (c.esFutura(datos.fechaNacimiento)) errores.push('La fecha de nacimiento no puede ser futura');
  }

  return errores;
}

// POST /auth/paciente/registro
function registroPaciente(req) {
  const datos = req.body;
  const errores = revisarDatos(datos, true);

  if (c.estaVacio(datos.correo)) errores.push('El correo es obligatorio');
  else if (!c.esCorreo(datos.correo)) errores.push('El correo no es válido');
  if (!c.esPasswordValida(datos.password)) errores.push(c.MENSAJE_PASSWORD);

  return errores;
}

module.exports = { login, registroMedico, registroPaciente };
