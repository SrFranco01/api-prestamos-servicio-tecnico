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

// Ruta raíz GET /: Devuelve la información y mapa de endpoints de la API en formato JSON
app.get('/', (req, res) => {
  res.json({
    ok: true,
    modulo: 'API REST Gestión de Préstamos de Celulares en Servicio Técnico',
    version: '1.0.0-fase1',
    equipo: 'Equipo 02',
    estado: 'OPERATIVO',
    health: '/health',
    endpoints: {
      listar_o_filtrar_prestamos: 'GET /api/v1/prestamos (ej: ?estado=ACTIVO)',
      registrar_prestamo: 'POST /api/v1/prestamos',
      consultar_prestamo_id: 'GET /api/v1/prestamos/:id',
      devolver_prestamo: 'PATCH /api/v1/prestamos/:id/devolucion',
      inventario_celulares: 'GET /api/v1/celulares',
      clientes: 'GET /api/v1/clientes',
      ordenes: 'GET /api/v1/ordenes',
      reset_base_datos: 'POST /api/v1/reset'
    },
    presentacion_slides: '/presentacion.html'
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
