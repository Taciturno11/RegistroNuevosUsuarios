const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getDotacion,
  guardarMeta,
  getResumenDotacion
} = require('../controllers/dotacion.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// ========================================
// RUTAS DE DOTACIÓN
// ========================================

// GET /api/dotacion - Obtener datos de dotación
router.get('/', getDotacion);

// POST /api/dotacion/meta - Guardar meta de dotación
router.post('/meta', guardarMeta);

// GET /api/dotacion/resumen - Obtener resumen de dotación
router.get('/resumen', getResumenDotacion);

module.exports = router;
