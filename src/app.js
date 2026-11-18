const express = require('express');
const path = require('node:path');
const { initDatabase } = require('./config/database');
const prestamosRoutes = require('./routes/prestamos.routes');
const inventarioRoutes = require('./routes/inventario.routes');

const app = express();

// Inicializar esquema de base de datos y datos semilla
initDatabase();

// Middlewares estándar
app.use(express.json());

// Middleware simple para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rutas de la API v1
app.use('/api/v1/prestamos', prestamosRoutes);
app.use('/api/v1', inventarioRoutes);

// Servir archivos estáticos de la raíz (presentacion.html, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Ruta raíz GET /: Si se abre en navegador sirve la presentación, si es petición API devuelve JSON
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, '..', 'presentacion.html'));
  }
  res.json({
    ok: true,
    modulo: 'API REST Gestión de Préstamos de Celulares en Servicio Técnico',
    version: '1.0.0-fase1',
    presentacion: '/presentacion.html',
    health: '/health',
    endpoints: {
      prestamos: '/api/v1/prestamos',
      celulares: '/api/v1/celulares',
      clientes: '/api/v1/clientes',
      ordenes: '/api/v1/ordenes',
      reset: 'POST /api/v1/reset'
    }
  });
});

app.get('/presentacion', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'presentacion.html'));
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    modulo: 'API REST Gestión de Préstamos de Celulares en Servicio Técnico',
    version: '1.0.0-fase1',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'RUTA_NO_ENCONTRADA',
    message: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor.`
  });
});

// Manejador centralizado de errores
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'ERROR_INTERNO';
  const message = err.message || 'Ocurrió un error inesperado en el servidor.';

  res.status(status).json({
    ok: false,
    error: code,
    message,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
