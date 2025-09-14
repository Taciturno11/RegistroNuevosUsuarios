const express = require('express');
const router = express.Router();
const tardanzasController = require('../controllers/tardanzas.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE TARDANZAS - SOLO ADMIN
// ========================================

// Obtener reporte detallado de tardanzas
router.get('/reporte', requireRole(['admin']), tardanzasController.getReporteTardanzas);

// Obtener reporte resumido por empleado
router.get('/resumido', requireRole(['admin']), tardanzasController.getReporteResumido);

// Obtener estadísticas resumidas de tardanzas
router.get('/estadisticas', requireRole(['admin']), tardanzasController.getEstadisticasTardanzas);

module.exports = router;
