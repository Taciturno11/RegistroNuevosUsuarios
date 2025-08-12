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

module.exports = router;
