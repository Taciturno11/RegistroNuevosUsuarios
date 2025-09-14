const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole, requireVista } = require('../middleware/auth.middleware');
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

// Middleware: permitir al propio usuario, admin, o usuarios con Dashboard
const allowSelfAdminOrDashboard = (req, res, next) => {
  const requester = req.user;
  const targetDni = req.params.dni;
  if (!requester) {
    return res.status(401).json({ success: false, message: 'Autenticación requerida' });
  }
  
  console.log(`🔍 allowSelfAdminOrDashboard: requester=${requester.dni} (${requester.role}), target=${targetDni}, vistas:`, requester.vistas);
  
  // Admin siempre puede
  if (requester.role === 'admin') {
    console.log('✅ allowSelfAdminOrDashboard: Admin acceso permitido');
    return next();
  }
  
  // Usuario accediendo a su propio perfil
  if (requester.dni === targetDni) {
    console.log('✅ allowSelfAdminOrDashboard: Acceso a propio perfil permitido');
    return next();
  }
  
  // Usuario con vista Dashboard puede ver otros empleados
  if (requester.vistas && requester.vistas.includes('Dashboard')) {
    console.log('✅ allowSelfAdminOrDashboard: Acceso permitido por vista Dashboard');
    return next();
  }
  
  console.log('❌ allowSelfAdminOrDashboard: Acceso denegado');
  return res.status(403).json({ success: false, message: 'Acceso denegado' });
};

// Rutas específicas primero (antes de /:dni para evitar interceptación)

// Control Maestro (solo admin)
router.get('/control-maestro', requireRole(['admin']), getAllEmpleadosConRoles);

// Stats y búsquedas (Dashboard o admin)
router.get('/stats', requireVista('Dashboard'), getEmpleadosStats);
router.get('/buscar', requireVista('Dashboard'), searchEmpleados);
router.get('/lookup', requireVista('Dashboard'), lookupEmpleados);

// Lista general (solo admin)
router.get('/', requireRole(['admin']), getAllEmpleados);

// Rutas de perfil individual (propio perfil o Dashboard)
router.get('/:dni/horario', allowSelfAdminOrDashboard, getHorarioBaseEmpleado);
router.get('/:dni', allowSelfAdminOrDashboard, getEmpleadoByDNI);

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
