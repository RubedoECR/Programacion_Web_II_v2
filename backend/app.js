require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToMongo, getStatus } = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas principales
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'MediVoz API activa', db: getStatus() });
});

// Endpoint de estado de base de datos
app.get('/api/db-status', (req, res) => {
  res.json(getStatus());
});

// Montar endpoints bajo el prefijo /api
app.use('/api', apiRoutes);

// Iniciar servidor inmediatamente y conectar a MongoDB de forma resiliente
connectToMongo().finally(() => {
  app.listen(PORT, () => {
    const status = getStatus();
    console.log(`\n🚀 Servidor MediVoz corriendo en http://localhost:${PORT}`);
    console.log(`🔌 Estado DB: ${status.mode} (Conectado a Atlas: ${status.connected ? 'SÍ' : 'NO - Modo Resiliente Activo'})`);
    console.log(`\nEndpoints disponibles:`);
    console.log(`  POST /api/login`);
    console.log(`  POST /api/register`);
    console.log(`  POST /api/paciente/registrar`);
    console.log(`  GET  /api/pacientes`);
    console.log(`  GET  /api/doctores`);
    console.log(`  POST /api/citas`);
    console.log(`  GET  /api/citas`);
    console.log(`  GET  /api/db-status\n`);
  });
});
