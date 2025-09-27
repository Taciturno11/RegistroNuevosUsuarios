const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');
const {
  generarReporteNomina,
  getAniosDisponibles,
  getTodasLasCampanias,
  diagnosticoSistema
} = require('../controllers/nomina.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo admin puede acceder a estas rutas
router.use(requireRole(['admin']));

// Generar reporte de nómina y asistencia
router.get('/generar-reporte', generarReporteNomina);

// Obtener años disponibles para reportes
router.get('/anios-disponibles', getAniosDisponibles);

// Obtener todas las campañas disponibles en la base de datos
router.get('/todas-las-campanias', getTodasLasCampanias);

// Endpoint de diagnóstico del sistema
router.get('/diagnostico', diagnosticoSistema);

module.exports = router;
