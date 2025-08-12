const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  crearPermiso,
  eliminarPermiso,
  listarPermisosEmpleado
} = require('../controllers/permisos.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear permiso especial
router.post('/', crearPermiso);

// Eliminar permiso especial (desactivar)
router.delete('/:id', eliminarPermiso);

// Listar permisos especiales de un empleado
router.get('/empleado/:dni', listarPermisosEmpleado);

module.exports = router;
