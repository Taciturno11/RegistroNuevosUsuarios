const express = require('express');
const router = express.Router();
const { authMiddleware, requireVista } = require('../middleware/auth.middleware');
const {
  obtenerHorarios,
  obtenerExcepciones,
  crearExcepcion,
  actualizarExcepcion,
  eliminarExcepcion,
  getExcepcionById,
  getEstadisticasExcepciones
} = require('../controllers/excepciones.controller');

// Todas las rutas requieren autenticación y vista de Asignación Excepciones
router.use(authMiddleware, requireVista('Asignación Excepciones'));

// ========================================
// RUTAS DE ASIGNACIÓN DE EXCEPCIONES
// ========================================

// Obtener horarios disponibles
router.get('/horarios', obtenerHorarios);

// Obtener estadísticas de excepciones (DEBE IR ANTES DE LAS RUTAS CON PARÁMETROS)
router.get('/estadisticas', getEstadisticasExcepciones);

// Obtener excepciones de un empleado
router.get('/:dni', obtenerExcepciones);

// Obtener excepción por ID
router.get('/id/:id', getExcepcionById);

// Crear nueva excepción
router.post('/', crearExcepcion);

// Actualizar excepción existente
router.put('/:id', actualizarExcepcion);

// Eliminar excepción
router.delete('/:id', eliminarExcepcion);

module.exports = router;
