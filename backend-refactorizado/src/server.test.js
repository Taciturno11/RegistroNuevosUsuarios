const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar rutas de prueba
const testRoutes = require('./routes/test.routes');

// Crear aplicación Express
const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend Refactorizado - Servidor de Prueba',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

// Rutas de prueba
app.use('/test', testRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Ruta para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    requestedUrl: req.originalUrl
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log('🚀 Servidor de prueba iniciado exitosamente');
  console.log(`📍 Escuchando en: http://${HOST}:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log('🧪 Rutas de prueba disponibles en: /test');
  console.log('=====================================');
});

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
