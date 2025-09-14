const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const acceso = require('../controllers/acceso.controller');

// Solo admin
router.use(authMiddleware, requireRole(['admin']));

router.get('/catalogo', acceso.getCatalogo);
router.post('/roles', acceso.createRole);
router.get('/roles/:nombreRol/vistas', acceso.getRoleVistas);
router.put('/roles/:nombreRol/vistas', acceso.setRoleVistas);

router.get('/empleados/:dni', acceso.getEmpleadoAcceso);
router.put('/empleados/:dni/rol', acceso.setEmpleadoRol);

module.exports = router;


