const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const empleadosRoutes = require('./routes/empleados.routes');
const catalogosRoutes = require('./routes/catalogos.routes');
const ceseRoutes = require('./routes/cese.routes');
const justificacionesRoutes = require('./routes/justificaciones.routes');
const ojtRoutes = require('./routes/ojt.routes');
const excepcionesRoutes = require('./routes/excepciones.routes');
const gruposRoutes = require('./routes/grupos.routes');
const reportesRoutes = require('./routes/reportes.routes');
const tardanzasRoutes = require('./routes/tardanzas.routes');
const permisosRoutes = require('./routes/permisos.routes');

// Crear aplicación Express
const app = express();



// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend Refactorizado - Sistema de Gestión de Empleados',
    status: 'running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    endpoints: {
      auth: '/api/auth',
      empleados: '/api/empleados',
      catalogos: '/api/catalogos',
      cese: '/api/cese',
      justificaciones: '/api/justificaciones',
      ojt: '/api/ojt',
      excepciones: '/api/excepciones',
      grupos: '/api/grupos',
      reportes: '/api/reportes',
      tardanzas: '/api/tardanzas',
      permisos: '/api/permisos'
    }
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/cese', ceseRoutes);
app.use('/api/justificaciones', justificacionesRoutes);
app.use('/api/ojt', ojtRoutes);
app.use('/api/excepciones', excepcionesRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/tardanzas', tardanzasRoutes);
app.use('/api/permisos', permisosRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  
  // Log del error completo
  console.error('Stack trace:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Error interno',
    timestamp: new Date().toISOString()
  });
});

// Ruta para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      '/api/auth',
      '/api/empleados',
      '/api/catalogos',
      '/api/cese',
      '/api/justificaciones',
      '/api/ojt',
      '/api/excepciones',
      '/api/grupos',
      '/api/reportes',
      '/api/tardanzas',
      '/api/permisos'
    ],
    timestamp: new Date().toISOString()
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Iniciar servidor
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 Backend Refactorizado iniciado exitosamente');
  console.log(`📍 Escuchando en: http://${HOST}:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`📊 Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests por ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000 / 60} minutos`);
  console.log('=====================================');
  console.log('🔐 Endpoints disponibles:');
  console.log('   /api/auth - Autenticación');
  console.log('   /api/empleados - Gestión de empleados');
  console.log('   /api/catalogos - Catálogos del sistema');
  console.log('   /api/cese - Gestión de cese');
  console.log('   /api/justificaciones - Justificaciones');
  console.log('   /api/ojt - OJT/CIC');
  console.log('   /api/excepciones - Excepciones de horarios');
  console.log('   /api/grupos - Gestión de grupos');
  console.log('   /api/reportes - Reportes del sistema');
  console.log('   /api/permisos - Permisos especiales');
  console.log('=====================================');
});

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
  server.close(() => {
    console.log('✅ Servidor cerrado por excepción no capturada');
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  server.close(() => {
    console.log('✅ Servidor cerrado por promesa rechazada');
    process.exit(1);
  });
});

module.exports = app;
