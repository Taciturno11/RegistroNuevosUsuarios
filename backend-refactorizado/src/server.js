const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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
const capacitacionesRoutes = require('./routes/capacitaciones.routes');
const nominaRoutes = require('./routes/nomina.routes');
const bonosRoutes = require('./routes/bonos.routes');
const organigramaRoutes = require('./routes/organigrama.routes');

// Importar utilidades de red
const { printNetworkInfo, getMainIP } = require('./utils/networkUtils');

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

// CORS mínimo para intranet - Configurable por IP
const frontendURL = process.env.FRONTEND_URL;
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true //esta bien

}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Frontend y backend en puertos separados (intranet)

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
      permisos: '/api/permisos',
      capacitaciones: '/api/capacitaciones',
      organigrama: '/api/organigrama'
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
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/empleados', require('./routes/empleados.routes'));
app.use('/api/catalogos', require('./routes/catalogos.routes'));
app.use('/api/cese', require('./routes/cese.routes'));
app.use('/api/grupos', require('./routes/grupos.routes'));
app.use('/api/justificaciones', require('./routes/justificaciones.routes'));
app.use('/api/ojt', require('./routes/ojt.routes'));
app.use('/api/excepciones', require('./routes/excepciones.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));
app.use('/api/tardanzas', require('./routes/tardanzas.routes'));
app.use('/api/nomina', require('./routes/nomina.routes'));
app.use('/api/capacitaciones', capacitacionesRoutes);
app.use('/api/bonos', bonosRoutes);
app.use('/api/organigrama', organigramaRoutes);
app.use('/api/acceso', require('./routes/acceso.routes'));

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
      '/api/permisos',
      '/api/capacitaciones',
      '/api/nomina',
      '/api/bonos',
      '/api/organigrama'
    ],
    timestamp: new Date().toISOString()
  });
});

// Puerto del servidor - Configuración desde .env
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Iniciar servidor
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 Backend Refactorizado iniciado exitosamente');
  console.log(`📍 Escuchando en: http://${HOST}:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${frontendURL}`);
  console.log(`📊 Rate Limit: 100 requests por 15 minutos`);
  console.log('=====================================');
  console.log('🔐 Endpoints disponibles:');
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
  console.log('   /api/capacitaciones - Sistema de capacitaciones');
  console.log('   /api/nomina - Pagos de nómina');
  console.log('   /api/bonos - Gestión de bonos');
  console.log('=====================================');
  
  // Mostrar información de red
  printNetworkInfo(PORT);
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
