// Configuración de Express: middlewares globales + router del API.
const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'MediVoz API activa' });
});

// Router del API: todas las rutas viven bajo /api
app.use('/api', apiRouter);

// Siempre al final
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
