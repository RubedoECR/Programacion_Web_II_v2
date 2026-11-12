// Funciones pequeñas que usan todos los validadores.
const { fechaDeHoy } = require('../utils/horarios');

function estaVacio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === '';
}

function esCorreo(valor) {
  return /^\S+@\S+\.\S+$/.test(String(valor));
}

// Al menos 10 dígitos (se ignoran espacios, guiones y paréntesis)
function esTelefono(valor) {
  return String(valor).replace(/\D/g, '').length >= 10;
}

// Formato AAAA-MM-DD
function esFecha(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor).slice(0, 10));
}

// ID de MongoDB: 24 caracteres hexadecimales
function esId(valor) {
  return /^[a-f0-9]{24}$/i.test(String(valor));
}

function esFutura(fecha) {
  return String(fecha).slice(0, 10) > fechaDeHoy();
}

// Contraseña: 8 a 15 caracteres, mayúscula, minúscula, número y carácter especial
function esPasswordValida(valor) {
  return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,15}$/.test(String(valor));
}
const MENSAJE_PASSWORD =
  'La contraseña debe tener de 8 a 15 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*)';

// Valida el :id de la URL
function idEnUrl(req) {
  const errores = [];
  if (!esId(req.params.id)) errores.push('El ID no es válido');
  return errores;
}

module.exports = { estaVacio, esCorreo, esTelefono, esFecha, esId, esFutura, esPasswordValida, MENSAJE_PASSWORD, idEnUrl };
