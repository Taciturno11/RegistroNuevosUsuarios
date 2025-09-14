const express = require('express');
const router = express.Router();
const { authMiddleware, requireVista } = require('../middleware/auth.middleware');
const {
  getAllCeses,
  getCeseByDNI,
  procesarCese,
  reactivarEmpleado,
  getEstadisticasCeses,
  registrarCese,
  anularCese
} = require('../controllers/cese.controller');

// Todas las rutas requieren autenticación y vista de Cese de Empleado
router.use(authMiddleware, requireVista('Cese de Empleado'));

// ========================================
// RUTAS DE CESE
// ========================================

// Obtener todos los ceses (con filtros y paginación)
router.get('/', getAllCeses);

// Obtener cese por DNI
router.get('/:dni', getCeseByDNI);

// Registrar cese de empleado (solo fecha, como en el proyecto original)
router.put('/:dni', registrarCese);

// Anular cese de empleado (reactivar)
router.delete('/:dni', anularCese);

// Procesar cese de empleado
router.post('/:dni/procesar', procesarCese);

// Reactivar empleado
router.post('/:dni/reactivar', reactivarEmpleado);

// Obtener estadísticas de ceses
router.get('/estadisticas', getEstadisticasCeses);

module.exports = router;
