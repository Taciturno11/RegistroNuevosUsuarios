const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE REPORTES - SOLO ANALISTAS
// ========================================

// Obtener reporte de asistencias (solo analistas)
router.get('/asistencias', requireRole(['analista']), reportesController.getReporteAsistencias);

// Obtener años disponibles para reportes (solo analistas)
router.get('/anios-disponibles', requireRole(['analista']), reportesController.getAniosDisponibles);

module.exports = router;
