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
  searchEmpleados,
  actualizarRolEmpleado,
  obtenerHistorialRoles,
  getAllEmpleadosConRoles,
  lookupEmpleados
} = require('../controllers/empleados.controller');
const { getHorarioBaseEmpleado } = require('../controllers/grupos.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los empleados (con filtros y paginación)
router.get('/', getAllEmpleados);

// Obtener todos los empleados con roles mapeados para el Control Maestro
router.get('/control-maestro', getAllEmpleadosConRoles);

// Obtener estadísticas de empleados
router.get('/stats', getEmpleadosStats);

// Buscar empleados por término de búsqueda
router.get('/buscar', searchEmpleados);

// Lookup para autocompletar DNI (acepta varios cargos: ?cargo=5&search=7156)
router.get('/lookup', lookupEmpleados);

// Obtener empleado por DNI
router.get('/:dni', getEmpleadoByDNI);

// Obtener horario base del empleado (NombreHorario y opcionalmente rango)
router.get('/:dni/horario', getHorarioBaseEmpleado);

// Crear nuevo empleado
router.post('/', createEmpleado);

// Actualizar empleado
router.put('/:dni', updateEmpleado);

// Eliminar empleado (cambiar estado a Inactivo)
router.delete('/:dni', deleteEmpleado);

// Obtener empleados por supervisor
router.get('/supervisor/:supervisorDNI', getEmpleadosBySupervisor);

// Actualizar rol de empleado (solo para el creador)
router.put('/:dni/rol', actualizarRolEmpleado);

// Obtener historial de cambios de roles (solo para el creador)
router.get('/historial-roles', obtenerHistorialRoles);

module.exports = router;
