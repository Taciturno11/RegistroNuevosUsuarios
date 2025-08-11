const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getAllEmpleados,
  getEmpleadoByDNI,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  getEmpleadosBySupervisor,
  getEmpleadosStats,
  searchEmpleados
} = require('../controllers/empleados.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los empleados (con filtros y paginación)
router.get('/', getAllEmpleados);

// Obtener estadísticas de empleados
router.get('/stats', getEmpleadosStats);

// Buscar empleados por término de búsqueda
router.get('/buscar', searchEmpleados);

// Obtener empleado por DNI
router.get('/:dni', getEmpleadoByDNI);

// Crear nuevo empleado
router.post('/', createEmpleado);

// Actualizar empleado
router.put('/:dni', updateEmpleado);

// Eliminar empleado (cambiar estado a Inactivo)
router.delete('/:dni', deleteEmpleado);

// Obtener empleados por supervisor
router.get('/supervisor/:supervisorDNI', getEmpleadosBySupervisor);

module.exports = router;
