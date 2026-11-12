// Validaciones de backend para la tabla de consultas.
const c = require('./comunes');

const SEVERIDADES = ['Leve', 'Moderado', 'Grave', 'Crítico'];

// Revisa que un número esté en un rango (si viene vacío no se revisa)
function revisarNumero(valor, minimo, maximo, etiqueta, errores) {
  if (c.estaVacio(valor)) return;
  const numero = Number(valor);
  if (isNaN(numero) || numero < minimo || numero > maximo) {
    errores.push(etiqueta + ' debe estar entre ' + minimo + ' y ' + maximo);
  }
}

function revisarSignos(datos, errores) {
  if (!c.estaVacio(datos.presion) && !/^\d{2,3}\/\d{2,3}$/.test(datos.presion)) {
    errores.push('La presión debe tener formato 120/80');
  }
  revisarNumero(datos.frecuencia, 20, 250, 'La frecuencia cardiaca', errores);
  revisarNumero(datos.frecuenciaResp, 5, 80, 'La frecuencia respiratoria', errores);
  revisarNumero(datos.saturacionO2, 50, 100, 'La saturación de oxígeno', errores);
  revisarNumero(datos.temperatura, 30, 45, 'La temperatura', errores);
  revisarNumero(datos.peso, 0.5, 400, 'El peso', errores);
  revisarNumero(datos.talla, 30, 250, 'La talla', errores);
  if (datos.severidad !== undefined && !SEVERIDADES.includes(datos.severidad)) errores.push('Severidad no válida');
}

// POST /consultas
function crear(req) {
  const datos = req.body;
  const errores = [];

  if (!c.esId(datos.paciente)) errores.push('Selecciona un paciente válido');
  if (!c.estaVacio(datos.cita) && !c.esId(datos.cita)) errores.push('La cita no es válida');

  const hayDiagnostico = Array.isArray(datos.diagnosticos) && datos.diagnosticos.length > 0;
  if (c.estaVacio(datos.sintomas) && !hayDiagnostico) errores.push('Registra al menos los síntomas o un diagnóstico');

  if (datos.medicamentos !== undefined) {
    if (!Array.isArray(datos.medicamentos)) {
      errores.push('Los medicamentos deben ser una lista');
    } else {
      for (const med of datos.medicamentos) {
        if (c.estaVacio(med.nombre)) errores.push('Cada medicamento necesita nombre');
      }
    }
  }

  revisarSignos(datos, errores);
  return errores;
}

// PUT /consultas/:id
function actualizar(req) {
  const errores = c.idEnUrl(req);
  revisarSignos(req.body, errores);
  return errores;
}

function listar(req) {
  const errores = [];
  if (req.query.paciente && !c.esId(req.query.paciente)) errores.push('Paciente inválido');
  return errores;
}

module.exports = { crear, actualizar, listar, obtener: c.idEnUrl, eliminar: c.idEnUrl };
