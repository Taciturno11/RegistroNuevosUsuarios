const express = require('express');
const router = express.Router();
const { authMiddleware, requireVista } = require('../middleware/auth.middleware');
const { getOrganigrama, expandirNodo } = require('../controllers/organigrama.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener organigrama inicial
router.get('/', requireVista('Organigrama'), getOrganigrama);

// Expandir nodo dinámicamente
router.get('/expandir', requireVista('Organigrama'), expandirNodo);

module.exports = router;
