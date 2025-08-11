const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getAllCatalogos,
  getAllJornadas,
  createJornada,
  getAllCargos,
  createCargo,
  getAllCampanias,
  createCampania,
  getAllModalidades,
  createModalidad,
  getAllGruposHorario,
  createGrupoHorario,
  getAllHorariosBase,
  createHorarioBase
} = require('../controllers/catalogos.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los catálogos en una sola consulta
router.get('/', getAllCatalogos);

// ========================================
// JORNADAS
// ========================================
router.get('/jornadas', getAllJornadas);
router.post('/jornadas', createJornada);

// ========================================
// CARGOS
// ========================================
router.get('/cargos', getAllCargos);
router.post('/cargos', createCargo);

// ========================================
// CAMPAÑAS
// ========================================
router.get('/campanias', getAllCampanias);
router.post('/campanias', createCampania);

// ========================================
// MODALIDADES
// ========================================
router.get('/modalidades', getAllModalidades);
router.post('/modalidades', createModalidad);

// ========================================
// GRUPOS DE HORARIO
// ========================================
router.get('/grupos-horario', getAllGruposHorario);
router.post('/grupos-horario', createGrupoHorario);

// ========================================
// HORARIOS BASE
// ========================================
router.get('/horarios-base', getAllHorariosBase);
router.post('/horarios-base', createHorarioBase);

module.exports = router;
