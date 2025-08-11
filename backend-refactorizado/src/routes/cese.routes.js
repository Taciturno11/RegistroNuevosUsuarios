const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getAllCeses,
  getCeseByDNI,
  procesarCese,
  reactivarEmpleado,
  getEstadisticasCeses
} = require('../controllers/cese.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE CESE
// ========================================

// Obtener todos los ceses (con filtros y paginación)
router.get('/', getAllCeses);

// Obtener cese por DNI
router.get('/:dni', getCeseByDNI);

// Procesar cese de empleado
router.post('/:dni/procesar', procesarCese);

// Reactivar empleado
router.post('/:dni/reactivar', reactivarEmpleado);

// Obtener estadísticas de ceses
router.get('/estadisticas', getEstadisticasCeses);

module.exports = router;
