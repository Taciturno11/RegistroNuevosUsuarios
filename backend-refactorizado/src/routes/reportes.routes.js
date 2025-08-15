const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE REPORTES - SOLO ANALISTAS
// ========================================

// Obtener reporte de asistencias (solo analistas y creador)
router.get('/asistencias', requireRole(['analista', 'creador']), reportesController.getReporteAsistencias);

// Obtener años disponibles para reportes (solo analistas y creador)
router.get('/anios-disponibles', requireRole(['analista', 'creador']), reportesController.getAniosDisponibles);

// Obtener campañas disponibles (solo analistas y creador)
router.get('/campanias-disponibles', requireRole(['analista', 'creador']), reportesController.getCampaniasDisponibles);

// Obtener cargos disponibles (solo analistas y creador)
router.get('/cargos-disponibles', requireRole(['analista', 'creador']), reportesController.getCargosDisponibles);

// ========================================
// GENERAR REPORTE DE ASISTENCIA MAESTRO
// ========================================

// Generar reporte de asistencia maestro (ejecuta SP crítico)
// SOLO ANALISTAS Y CREADOR pueden ejecutar este SP crítico
router.post('/asistencia', [
  requireRole(['analista', 'creador']),
  // Validación de fechas en el controlador para mayor seguridad
], reportesController.generarReporteAsistencia);

module.exports = router;
