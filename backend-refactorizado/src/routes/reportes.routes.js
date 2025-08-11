const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  generarReporteAsistencia,
  getStoredProcedureInfo,
  getEstadisticasReportes
} = require('../controllers/reportes.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE REPORTES
// ========================================

// Generar reporte de asistencia maestro
router.post('/asistencia', generarReporteAsistencia);

// Obtener información del stored procedure
router.get('/sp-info', getStoredProcedureInfo);

// Obtener estadísticas de reportes
router.get('/estadisticas', getEstadisticasReportes);

// Ruta raíz de reportes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Reportes - Sistema de Gestión de Empleados',
    version: '1.0.0',
    endpoints: {
      'POST /asistencia': 'Generar reporte de asistencia maestro',
      'GET /sp-info': 'Obtener información del stored procedure',
      'GET /estadisticas': 'Obtener estadísticas de reportes'
    },
    descripcion: 'Módulo para generar reportes del sistema, incluyendo reporte maestro de asistencia'
  });
});

module.exports = router;
