const express = require('express');
const router = express.Router();
const tardanzasController = require('../controllers/tardanzas.controller');
const { authMiddleware, requireRole, requireVista } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE TARDANZAS - SOLO ADMIN
// ========================================

// Obtener reporte detallado de tardanzas
router.get('/reporte', requireVista('Reporte de Tardanzas'), tardanzasController.getReporteTardanzas);

// Obtener reporte resumido por empleado
router.get('/resumido', requireVista('Reporte de Tardanzas'), tardanzasController.getReporteResumido);

// Obtener estadísticas resumidas de tardanzas
router.get('/estadisticas', requireVista('Reporte de Tardanzas'), tardanzasController.getEstadisticasTardanzas);

module.exports = router;
