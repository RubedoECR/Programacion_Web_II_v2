// Validaciones de backend para la tabla de pacientes.
const c = require('./comunes');

const SEXOS = ['Masculino', 'Femenino', 'Otro'];
const TIPOS_SANGRE = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Revisa los datos de un paciente.
// esNuevo = true  → todos los campos obligatorios deben venir
// esNuevo = false → solo se revisan los campos que sí vienen (actualización)
function revisarDatos(datos, esNuevo) {
  const errores = [];

  if (esNuevo || datos.nombre !== undefined) {
    if (c.estaVacio(datos.nombre)) errores.push('El nombre es obligatorio');
  }
  if (esNuevo || datos.apellidoP !== undefined) {
    if (c.estaVacio(datos.apellidoP)) errores.push('El apellido paterno es obligatorio');
  }
  if (esNuevo || datos.fechaNacimiento !== undefined) {
    if (!c.esFecha(datos.fechaNacimiento)) errores.push('La fecha de nacimiento no es válida');
    else if (c.esFutura(datos.fechaNacimiento)) errores.push('La fecha de nacimiento no puede ser futura');
  }
  if (esNuevo || datos.sexo !== undefined) {
    if (!SEXOS.includes(datos.sexo)) errores.push('Selecciona un sexo válido');
  }
  if (esNuevo || datos.telefono !== undefined) {
    if (!c.esTelefono(datos.telefono || '')) errores.push('El teléfono debe tener al menos 10 dígitos');
  }
  if (datos.tipoSangre !== undefined && !TIPOS_SANGRE.includes(datos.tipoSangre)) {
    errores.push('Tipo de sangre no válido');
  }
  if (!c.estaVacio(datos.contactoTelefono) && !c.esTelefono(datos.contactoTelefono)) {
    errores.push('El teléfono del contacto debe tener al menos 10 dígitos');
  }
  if (datos.estado !== undefined && datos.estado !== 'Activo' && datos.estado !== 'Inactivo') {
    errores.push('Estado no válido');
  }

  return errores;
}

// PUT /pacientes/:id
function actualizar(req) {
  const errores = c.idEnUrl(req);
  return errores.concat(revisarDatos(req.body, false));
}

// GET /pacientes/:id  → acepta el _id o el expediente (EXP-000001)
function obtener(req) {
  const id = req.params.id;
  if (c.esId(id) || /^EXP-\d{6}$/.test(id)) return [];
  return ['Usa el ID o el número de expediente (EXP-000001)'];
}

module.exports = { revisarDatos, actualizar, obtener, eliminar: c.idEnUrl };
