const express = require('express');
const router = express.Router();
const { authMiddleware, requireVista } = require('../middleware/auth.middleware');
const {
  getAllJustificaciones,
  getJustificacionById,
  getJustificacionesByEmpleado,
  createJustificacion,
  aprobarJustificacion,
  getEstadisticasJustificaciones,
  deleteJustificacion,
  getTiposJustificacion
} = require('../controllers/justificaciones.controller');

// Todas las rutas requieren autenticación y vista de JUSTIFICACIONES
router.use(authMiddleware, requireVista('JUSTIFICACIONES'));

// ========================================
// RUTAS DE JUSTIFICACIONES
// ========================================

// Rutas específicas ANTES de rutas con parámetros
router.get('/tipos', getTiposJustificacion);
router.get('/estadisticas', getEstadisticasJustificaciones);

// Obtener todas las justificaciones (con filtros y paginación)
router.get('/', getAllJustificaciones);

// Obtener justificaciones por empleado (ruta explícita)
router.get('/empleado/:dni', getJustificacionesByEmpleado);

// Obtener justificación por ID
router.get('/justificacion/:id', getJustificacionById);

// Obtener justificaciones por empleado (ruta simple para compatibilidad) - AL FINAL
router.get('/:dni', getJustificacionesByEmpleado);

// Crear nueva justificación
router.post('/', createJustificacion);

// Aprobar/Rechazar justificación
router.put('/:id/aprobar', aprobarJustificacion);

// Eliminar justificación
router.delete('/:id', deleteJustificacion);

module.exports = router;
