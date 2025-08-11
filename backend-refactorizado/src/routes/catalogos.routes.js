const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { getCatalogos } = require('../controllers/catalogos.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los catálogos
router.get('/', getCatalogos);

module.exports = router;
