const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  listarBases,
  listarDescansos,
  listarBasesConHoras,
  getInfoGrupos
} = require('../controllers/grupos.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========================================
// RUTAS DE GRUPOS DE HORARIO
// ========================================

// Obtener información general del sistema de grupos
router.get('/info', getInfoGrupos);

// Listar grupos base con rango horario (entrada/salida)
router.get('/horas', listarBasesConHoras);

// Listar solo los 32 nombres base (sin descansos)
router.get('/bases', listarBases);

// Listar las 7 variantes de descanso de un grupo específico
router.get('/:base', listarDescansos);

// Ruta raíz de grupos (DEBE IR AL FINAL)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Grupos de Horario - Sistema de Gestión de Empleados',
    version: '1.0.0',
    endpoints: {
      'GET /info': 'Obtener información general del sistema de grupos',
      'GET /horas': 'Listar grupos base con rango horario (entrada/salida)',
      'GET /bases': 'Listar solo los 32 nombres base (sin descansos)',
      'GET /:base': 'Listar las 7 variantes de descanso de un grupo específico'
    },
    descripcion: 'Módulo para gestionar grupos de horario y sus variantes de descanso',
    nota: 'Este módulo es crítico para el frontend en la selección de grupos de horario'
  });
});

module.exports = router;
