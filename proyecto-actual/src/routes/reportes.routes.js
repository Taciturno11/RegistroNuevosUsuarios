const { Router } = require('express');
const { body } = require('express-validator');
const { generarReporteAsistencia } = require('../controllers/reportes.controller');
const { authMiddleware } = require('../controllers/auth.controller');

const router = Router();

// Generar reporte de asistencia maestro
router.post('/asistencia', [
  body('fechaInicio').isISO8601().toDate().withMessage('Fecha de inicio inválida'),
  body('fechaFin').isISO8601().toDate().withMessage('Fecha de fin inválida')
], authMiddleware, generarReporteAsistencia);

module.exports = router; 