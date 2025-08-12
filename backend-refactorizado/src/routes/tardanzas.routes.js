const express = require('express');
const router = express.Router();
const tardanzasController = require('../controllers/tardanzas.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE TARDANZAS - ANALISTAS Y CREADOR
// ========================================

// Obtener reporte detallado de tardanzas
router.get('/reporte', requireRole(['analista', 'creador']), tardanzasController.getReporteTardanzas);

// Obtener reporte resumido por empleado
router.get('/resumido', requireRole(['analista', 'creador']), tardanzasController.getReporteResumido);

// Obtener estadísticas resumidas de tardanzas
router.get('/estadisticas', requireRole(['analista', 'creador']), tardanzasController.getEstadisticasTardanzas);

module.exports = router;
