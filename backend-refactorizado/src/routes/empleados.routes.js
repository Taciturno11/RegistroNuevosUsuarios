const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
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

// Middleware: permitir solo al propio usuario (o admin)
const allowSelfOrAdmin = (req, res, next) => {
  const requester = req.user;
  const targetDni = req.params.dni;
  if (!requester) {
    return res.status(401).json({ success: false, message: 'Autenticación requerida' });
  }
  if (requester.role === 'admin' || requester.dni === targetDni) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Acceso denegado' });
};

// A partir de aquí, solo admin
router.use(requireRole(['admin']));

// Rutas específicas deben ir ANTES de las rutas con parámetros
// Obtener todos los empleados con roles mapeados para el Control Maestro
router.get('/control-maestro', getAllEmpleadosConRoles);

// Obtener estadísticas de empleados
router.get('/stats', getEmpleadosStats);

// Buscar empleados por término de búsqueda
router.get('/buscar', searchEmpleados);

// Lookup para autocompletar DNI (acepta varios cargos: ?cargo=5&search=7156)
router.get('/lookup', lookupEmpleados);

// Obtener todos los empleados (con filtros y paginación)
router.get('/', getAllEmpleados);

// Accesos para agentes: solo su propio perfil y horario
// IMPORTANTE: las rutas con parámetros deben ir al final para no interceptar rutas específicas
router.get('/:dni/horario', allowSelfOrAdmin, getHorarioBaseEmpleado);
router.get('/:dni', allowSelfOrAdmin, getEmpleadoByDNI);

// (Rutas movidas arriba con allowSelfOrAdmin)

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
