const express = require('express');
const router = express.Router();
const capacitacionesController = require('../controllers/capacitaciones.controller');
const { requireRole, authMiddleware } = require('../middleware/auth.middleware');

// Generar token JWT temporal (SOLO PARA PRUEBAS - sin autenticación)
router.post('/generate-token', capacitacionesController.generateToken);

// Endpoint de prueba (sin autenticación)
router.get('/test', capacitacionesController.test);

// Obtener capas disponibles para un capacitador (SIN autenticación - como en el original)
router.get('/capas', capacitacionesController.getCapas);

// Obtener meses disponibles para un capacitador (requiere autenticación)
router.get('/meses', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.getMeses);

// Obtener postulantes y asistencias (requiere autenticación)
router.get('/postulantes', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.getPostulantes);

// Obtener deserciones (requiere autenticación)
router.get('/deserciones', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.getDeserciones);

// Obtener evaluaciones (requiere autenticación)
router.get('/evaluaciones', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.getEvaluaciones);

// Obtener horarios base (SIN autenticación - como en el original)
router.get('/horarios-base', capacitacionesController.getHorariosBase);

// Guardar asistencias en lote (requiere autenticación)
router.post('/asistencia/bulk', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.saveAsistencias);

// Guardar deserciones en lote (requiere autenticación)
router.post('/deserciones/bulk', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.saveDeserciones);

// Guardar evaluaciones en lote (requiere autenticación)
router.post('/evaluaciones/bulk', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.saveEvaluaciones);

// Actualizar estado de postulantes (requiere autenticación)
router.post('/postulantes/estado', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.updateEstadoPostulantes);

// Actualizar horarios de postulantes (requiere autenticación)
router.post('/postulantes/horario', authMiddleware, requireRole(['capacitador', 'coordinadora', 'admin', 'creador']), capacitacionesController.updateHorariosPostulantes);

module.exports = router;
