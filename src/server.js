const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 API Servicio Técnico - Préstamo de Celulares`);
  console.log(`📍 Servidor escuchando en: http://localhost:${PORT}`);
  console.log(`📡 Healthcheck: http://localhost:${PORT}/health`);
  console.log(`📋 Préstamos:   http://localhost:${PORT}/api/v1/prestamos`);
  console.log(`📱 Celulares:   http://localhost:${PORT}/api/v1/celulares`);
  console.log(`====================================================`);
});
