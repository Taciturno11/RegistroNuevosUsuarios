const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');
const {
  generarReporteNomina,
  getAniosDisponibles,
  getTodasLasCampanias
} = require('../controllers/nomina.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo analistas y creador pueden acceder a estas rutas
router.use(requireRole(['analista', 'creador']));

// Generar reporte de nómina y asistencia
router.get('/generar-reporte', generarReporteNomina);

// Obtener años disponibles para reportes
router.get('/anios-disponibles', getAniosDisponibles);

// Obtener todas las campañas disponibles en la base de datos
router.get('/todas-las-campanias', getTodasLasCampanias);

module.exports = router;
