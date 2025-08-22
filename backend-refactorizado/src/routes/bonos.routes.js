const express = require('express');
const router = express.Router();
const {
  getBonosEmpleado,
  registrarBono,
  eliminarBono,
  getEstadisticasBonos
} = require('../controllers/bonos.controller');

// Obtener bonos de un empleado
router.get('/empleado/:dni', getBonosEmpleado);

// Registrar nuevo bono
router.post('/registrar', registrarBono);

// Eliminar bono
router.delete('/:id', eliminarBono);

// Obtener estadísticas de bonos de un empleado
router.get('/estadisticas/:dni', getEstadisticasBonos);

module.exports = router;
