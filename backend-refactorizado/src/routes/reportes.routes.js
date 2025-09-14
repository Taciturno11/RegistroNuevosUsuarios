const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { authMiddleware, requireRole, requireVista } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE REPORTES - SOLO ANALISTAS
// ========================================

// Middleware para reportes: admin o usuarios con cualquier vista de reporte
const requireReportAccess = (req, res, next) => {
  if (req.user.role === 'admin' || 
      (req.user.vistas && (req.user.vistas.includes('Reporte de Asistencias') || req.user.vistas.includes('Reporte de Tardanzas')))) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado - Necesita vista de reportes',
    error: 'INSUFFICIENT_PERMISSIONS'
  });
};

// Obtener reporte de asistencias
router.get('/asistencias', requireVista('Reporte de Asistencias'), reportesController.getReporteAsistencias);

// Opciones de filtros (disponibles para cualquier vista de reporte)
router.get('/anios-disponibles', requireReportAccess, reportesController.getAniosDisponibles);
router.get('/campanias-disponibles', requireReportAccess, reportesController.getCampaniasDisponibles);
router.get('/cargos-disponibles', requireReportAccess, reportesController.getCargosDisponibles);

// ========================================
// GENERAR REPORTE DE ASISTENCIA MAESTRO
// ========================================

// Generar reporte de asistencia maestro (ejecuta SP crítico)
// SOLO ANALISTAS Y CREADOR pueden ejecutar este SP crítico
router.post('/asistencia', [
  requireRole(['admin']),
  // Validación de fechas en el controlador para mayor seguridad
], reportesController.generarReporteAsistencia);

module.exports = router;
