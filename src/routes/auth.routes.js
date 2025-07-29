const { Router } = require('express');
const { 
  login, 
  authMiddleware
} = require('../controllers/auth.controller');

const router = Router();

// Ruta de login
router.post('/login', login);

// Exportar middleware para usar en otras rutas
router.authMiddleware = authMiddleware;

module.exports = router; 