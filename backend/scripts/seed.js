// Carga datos iniciales en la base de datos.
//
//   npm run seed          → agrega lo que falte (no borra nada)
//   npm run seed:reset    → BORRA las 6 colecciones y carga datos de prueba limpios
//
require('dotenv').config();
const mongoose = require('mongoose');

const Usuario = require('../src/models/Usuario');
const Paciente = require('../src/models/Paciente');
const Medicamento = require('../src/models/Medicamento');
const Cita = require('../src/models/Cita');
const Consulta = require('../src/models/Consulta');
const Receta = require('../src/models/Receta');

const BORRAR_TODO = process.argv.includes('--reset');

const MEDICAMENTOS = [
  { nombre: 'Paracetamol', presentacion: 'Tabletas', concentracion: '500 mg', via: 'Oral', dosisSugerida: '500 mg cada 8 horas por 3 días' },
  { nombre: 'Ibuprofeno', presentacion: 'Tabletas', concentracion: '400 mg', via: 'Oral', dosisSugerida: '400 mg cada 8 horas después de alimentos por 5 días' },
  { nombre: 'Amoxicilina / Ác. Clavulánico', presentacion: 'Tabletas', concentracion: '500/125 mg', via: 'Oral', dosisSugerida: '500/125 mg cada 8 horas por 7 días' },
  { nombre: 'Omeprazol', presentacion: 'Cápsulas', concentracion: '20 mg', via: 'Oral', dosisSugerida: '20 mg cada 24 horas en ayunas durante 14 días' },
  { nombre: 'Ketorolaco', presentacion: 'Tabletas', concentracion: '10 mg', via: 'Sublingual', dosisSugerida: '10 mg cada 12 horas condicionado a dolor severo' },
  { nombre: 'Losartán', presentacion: 'Tabletas', concentracion: '50 mg', via: 'Oral', dosisSugerida: '50 mg cada 24 horas por la mañana' },
  { nombre: 'Metformina', presentacion: 'Tabletas', concentracion: '850 mg', via: 'Oral', dosisSugerida: '850 mg cada 12 horas con alimentos' },
  { nombre: 'Loratadina', presentacion: 'Tabletas', concentracion: '10 mg', via: 'Oral', dosisSugerida: '10 mg cada 24 horas por 7 días' },
];

const MEDICOS = [
  { nombre: 'Diego', apellidoP: 'Leal', email: 'diego.leal@medivoz.com', password: 'Medivoz@2026', especialidad: 'Medicina General', cedula: 'CED-8492018' },
  { nombre: 'Edgar', apellidoP: 'Cepeda', email: 'edgar.cepeda@medivoz.com', password: 'Medivoz@2026', especialidad: 'Medicina Interna', cedula: 'CED-7310459' },
];

const PACIENTES = [
  { expediente: 'EXP-000001', nombre: 'Carlos', apellidoP: 'Gómez', apellidoM: 'Ruiz', fechaNacimiento: '1985-04-12', sexo: 'Masculino', telefono: '8119876543', correo: 'carlos.gomez@correo.com', password: 'Paciente@2026', tipoSangre: 'O+', direccion: 'Av. Constitución 1234, Monterrey, NL', alergias: ['Penicilina'], contactoEmergencia: { nombre: 'María Ruiz', parentesco: 'Madre', telefono: '8111223344' } },
  { expediente: 'EXP-000002', nombre: 'Ana', apellidoP: 'Martínez', apellidoM: 'López', fechaNacimiento: '1992-09-30', sexo: 'Femenino', telefono: '8122334455', correo: 'ana.martinez@correo.com', password: 'Paciente@2026', tipoSangre: 'A+', direccion: 'Calle Hidalgo 45, San Pedro, NL', alergias: [], contactoEmergencia: { nombre: 'Luis Martínez', parentesco: 'Esposo', telefono: '8133445566' } },
  { expediente: 'EXP-000003', nombre: 'Jorge', apellidoP: 'Ramírez', apellidoM: 'Treviño', fechaNacimiento: '1968-01-22', sexo: 'Masculino', telefono: '8144556677', correo: 'jorge.ramirez@correo.com', password: 'Paciente@2026', tipoSangre: 'B+', direccion: 'Col. Mitras Centro, Monterrey, NL', alergias: ['Sulfas'], contactoEmergencia: { nombre: 'Rosa Treviño', parentesco: 'Hermana', telefono: '8155667788' } },
];

// Fecha AAAA-MM-DD sumando días a hoy (negativo = días atrás)
function fechaConDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a "' + mongoose.connection.name + '"');

  if (BORRAR_TODO) {
    await Usuario.deleteMany({});
    await Paciente.deleteMany({});
    await Medicamento.deleteMany({});
    await Cita.deleteMany({});
    await Consulta.deleteMany({});
    await Receta.deleteMany({});
    console.log('🧹 Colecciones vaciadas');
  }

  for (const m of MEDICAMENTOS) {
    const existe = await Medicamento.findOne({ nombre: m.nombre });
    if (!existe) await Medicamento.create(m);
  }

  const medicos = [];
  for (const datos of MEDICOS) {
    let medico = await Usuario.findOne({ email: datos.email });
    if (!medico) medico = await Usuario.create(datos);
    medicos.push(medico);
  }

  const pacientes = [];
  for (const datos of PACIENTES) {
    let paciente = await Paciente.findOne({ correo: datos.correo });
    if (!paciente && !(await Paciente.findOne({ expediente: datos.expediente }))) {
      paciente = await Paciente.create(datos);
    }
    if (paciente) pacientes.push(paciente);
  }

  // Citas, consultas y recetas de ejemplo solo en modo --reset
  if (BORRAR_TODO) {
    const [diego, edgar] = medicos;
    const [carlos, ana, jorge] = pacientes;
    const paracetamol = await Medicamento.findOne({ nombre: 'Paracetamol' });
    const losartan = await Medicamento.findOne({ nombre: 'Losartán' });

    const citaPasada = await Cita.create({ paciente: carlos._id, medico: diego._id, fecha: fechaConDias(-3), hora: '09:00', motivo: 'Dolor de cabeza y fiebre', estado: 'Atendida' });
    await Cita.create({ paciente: jorge._id, medico: edgar._id, fecha: fechaConDias(-2), hora: '10:30', motivo: 'Control de presión', estado: 'Cancelada' });
    await Cita.create({ paciente: ana._id, medico: diego._id, fecha: fechaConDias(0), hora: '14:30', motivo: 'Revisión general' });
    await Cita.create({ paciente: jorge._id, medico: diego._id, fecha: fechaConDias(1), hora: '11:00', motivo: 'Seguimiento de hipertensión' });
    await Cita.create({ paciente: carlos._id, medico: edgar._id, fecha: fechaConDias(2), hora: '12:00', motivo: 'Resultados de laboratorio' });

    const c1 = await Consulta.create({ paciente: carlos._id, medico: diego._id, cita: citaPasada._id, fecha: new Date(fechaConDias(-3) + 'T09:15:00'), severidad: 'Moderado', presion: '125/85', frecuencia: 88, temperatura: 38.6, peso: 80, talla: 175, imc: 26.1, sintomas: 'Cefalea pulsátil y fiebre de 2 días', diagnosticos: ['Rinofaringitis aguda (resfriado común)'], alergias: ['Penicilina'] });
    await Receta.create({ consulta: c1._id, paciente: carlos._id, medico: diego._id, fecha: c1.fecha, folio: 'REC-' + String(c1._id).slice(-6).toUpperCase(), medicamentos: [{ medicamento: paracetamol._id, nombre: paracetamol.nombre, dosis: paracetamol.dosisSugerida }], indicaciones: 'Reposo e hidratación abundante.' });

    const c2 = await Consulta.create({ paciente: jorge._id, medico: edgar._id, fecha: new Date(fechaConDias(-10) + 'T10:00:00'), severidad: 'Leve', presion: '145/95', frecuencia: 76, temperatura: 36.5, peso: 92, talla: 170, imc: 31.8, sintomas: 'Cefalea occipital matutina', diagnosticos: ['Hipertensión arterial sistémica estadio 1'], alergias: ['Sulfas'] });
    await Receta.create({ consulta: c2._id, paciente: jorge._id, medico: edgar._id, fecha: c2.fecha, folio: 'REC-' + String(c2._id).slice(-6).toUpperCase(), medicamentos: [{ medicamento: losartan._id, nombre: losartan.nombre, dosis: losartan.dosisSugerida }], indicaciones: 'Dieta baja en sodio. Tomar la presión diario.' });

    console.log('📋 Citas, consultas y recetas de ejemplo creadas');
  }

  console.log('✅ Seed terminado');
  console.log('   Médicos:   diego.leal@medivoz.com / edgar.cepeda@medivoz.com   (contraseña: Medivoz@2026)');
  console.log('   Pacientes: carlos.gomez@correo.com / ana.martinez@correo.com / jorge.ramirez@correo.com   (contraseña: Paciente@2026)');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('❌ Error en el seed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
