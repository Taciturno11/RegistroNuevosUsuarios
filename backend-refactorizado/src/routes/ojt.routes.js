const express = require('express');
const router = express.Router();
const { authMiddleware, requireVista } = require('../middleware/auth.middleware');
const {
  listarDNIsOJT,
  listarHistorial,
  crearOJT,
  actualizarOJT,
  eliminarOJT,
  getEstadisticasOJT,
  getOJTById
} = require('../controllers/ojt.controller');

// Todas las rutas requieren autenticación y vista de OJT / CIC
router.use(authMiddleware, requireVista('OJT / CIC'));

// ========================================
// RUTAS DE OJT (ON-THE-JOB TRAINING) / CIC
// ========================================

// Obtener lista de DNIs de empleados activos para autocomplete
router.get('/dnis', listarDNIsOJT);

// Obtener estadísticas de OJT (DEBE IR ANTES DE LAS RUTAS CON PARÁMETROS)
router.get('/estadisticas', getEstadisticasOJT);

// Obtener historial OJT por DNI de empleado
router.get('/:dni/historial', listarHistorial);

// Obtener registro OJT por ID
router.get('/:id', getOJTById);

// Crear nuevo registro OJT
router.post('/', crearOJT);

// Actualizar registro OJT existente
router.patch('/:id', actualizarOJT);

// Eliminar registro OJT
router.delete('/:id', eliminarOJT);

module.exports = router;
