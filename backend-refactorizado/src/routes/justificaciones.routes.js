const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getAllJustificaciones,
  getJustificacionById,
  getJustificacionesByEmpleado,
  createJustificacion,
  aprobarJustificacion,
  getEstadisticasJustificaciones
} = require('../controllers/justificaciones.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE JUSTIFICACIONES
// ========================================

// Obtener todas las justificaciones (con filtros y paginación)
router.get('/', getAllJustificaciones);

// Obtener justificación por ID
router.get('/:id', getJustificacionById);

// Obtener justificaciones por empleado
router.get('/empleado/:dni', getJustificacionesByEmpleado);

// Crear nueva justificación
router.post('/', createJustificacion);

// Aprobar/Rechazar justificación
router.put('/:id/aprobar', aprobarJustificacion);

// Obtener estadísticas de justificaciones
router.get('/estadisticas', getEstadisticasJustificaciones);

module.exports = router;
