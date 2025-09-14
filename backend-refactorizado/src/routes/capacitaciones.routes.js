const express = require('express');
const router = express.Router();
const capacitacionesController = require('../controllers/capacitaciones.controller');
const { requireRole, authMiddleware } = require('../middleware/auth.middleware');

// Generar token JWT temporal (SOLO PARA PRUEBAS - sin autenticación)
router.post('/generate-token', capacitacionesController.generateToken);

// Endpoint de prueba (sin autenticación)
router.get('/test', capacitacionesController.test);

// Endpoint para verificar tablas disponibles (sin autenticación)
router.get('/verificar-tablas', capacitacionesController.verificarTablas);

// Endpoint para verificar estructura de tablas (sin autenticación)
router.get('/verificar-estructura-tablas', capacitacionesController.verificarEstructuraTablas);

// Endpoint de prueba para consulta de campañas (sin autenticación)
router.get('/probar-consulta-campanias', capacitacionesController.probarConsultaCampanias);

// Obtener capas disponibles para un capacitador (SIN autenticación - como en el original)
router.get('/capas', capacitacionesController.getCapas);

// Obtener meses disponibles para un capacitador (requiere autenticación)
router.get('/meses', authMiddleware, requireRole(['admin']), capacitacionesController.getMeses);

// Obtener postulantes y asistencias (requiere autenticación)
router.get('/postulantes', authMiddleware, requireRole(['admin']), capacitacionesController.getPostulantes);

// Obtener deserciones (requiere autenticación)
router.get('/deserciones', authMiddleware, requireRole(['admin']), capacitacionesController.getDeserciones);

// Obtener evaluaciones (requiere autenticación)
router.get('/evaluaciones', authMiddleware, requireRole(['admin']), capacitacionesController.getEvaluaciones);

// Obtener horarios base (SIN autenticación - como en el original)
router.get('/horarios-base', capacitacionesController.getHorariosBase);

// Guardar asistencias en lote (requiere autenticación)
router.post('/asistencia/bulk', authMiddleware, requireRole(['admin']), capacitacionesController.saveAsistencias);

// Guardar deserciones en lote (requiere autenticación)
router.post('/deserciones/bulk', authMiddleware, requireRole(['admin']), capacitacionesController.saveDeserciones);

// Guardar evaluaciones en lote (requiere autenticación)
router.post('/evaluaciones/bulk', authMiddleware, requireRole(['admin']), capacitacionesController.saveEvaluaciones);

// Actualizar estado de postulantes (requiere autenticación)
router.post('/postulantes/estado', authMiddleware, requireRole(['admin']), capacitacionesController.updateEstadoPostulantes);

// Actualizar horarios de postulantes (requiere autenticación)
router.post('/postulantes/horario', authMiddleware, requireRole(['admin']), capacitacionesController.updateHorariosPostulantes);

// ============================================================================
// RUTAS PARA DASHBOARD DE JEFA
// ============================================================================

/**
 * Obtener campañas disponibles para el dashboard de jefa
 * GET /api/capacitaciones/dashboard-jefa/campanias
 */
router.get('/dashboard-jefa/campanias', authMiddleware, capacitacionesController.obtenerCampaniasDashboardJefa);

/**
 * Obtener meses disponibles para el dashboard de jefa
 * GET /api/capacitaciones/dashboard-jefa/meses
 */
router.get('/dashboard-jefa/meses', authMiddleware, capacitacionesController.obtenerMesesDashboardJefa);

/**
 * Obtener capas disponibles para una campaña específica
 * GET /api/capacitaciones/dashboard-jefa/capas?campania=ID
 */
router.get('/dashboard-jefa/capas', authMiddleware, capacitacionesController.obtenerCapasDashboardJefa);

/**
 * Obtener datos del dashboard de jefa
 * GET /api/capacitaciones/dashboard-jefa/:dni
 */
router.get('/dashboard-jefa/:dni', authMiddleware, capacitacionesController.obtenerDashboardJefa);

// Rutas para el resumen de capacitaciones de la jefa
router.get('/resumen-jefe', authMiddleware, capacitacionesController.obtenerResumenJefa);
router.post('/qentre-jefe', authMiddleware, capacitacionesController.saveQEntreJefa);

module.exports = router;
