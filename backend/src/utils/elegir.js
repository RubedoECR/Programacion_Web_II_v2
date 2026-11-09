// Copia solo los campos permitidos que sí vienen en el objeto.
// Evita que el cliente modifique campos que no debe (ej. rol, expediente, medico).
function elegir(origen, campos) {
  const resultado = {};
  for (const campo of campos) {
    if (origen[campo] !== undefined) resultado[campo] = origen[campo];
  }
  return resultado;
}

module.exports = elegir;
