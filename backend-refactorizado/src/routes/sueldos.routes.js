const express = require('express');
const router = express.Router();
const { authMiddleware, requireVista } = require('../middleware/auth.middleware');
const {
  getSueldoBase,
  getHistorialSueldos,
  actualizarSueldoBase,
  getEstadisticasSueldos,
  eliminarSueldoBase
} = require('../controllers/sueldos.controller');

// Todas las rutas requieren autenticación y vista de BONOS
router.use(authMiddleware, requireVista('BONOS'));

// Obtener sueldo base actual de un empleado
router.get('/empleado/:dni', getSueldoBase);

// Obtener historial de sueldos base de un empleado
router.get('/historial/:dni', getHistorialSueldos);

// Actualizar sueldo base de un empleado
router.post('/actualizar', actualizarSueldoBase);

// Obtener estadísticas de sueldos de un empleado
router.get('/estadisticas/:dni', getEstadisticasSueldos);

// Eliminar sueldo base
router.delete('/eliminar/:sueldoId', eliminarSueldoBase);

module.exports = router;
