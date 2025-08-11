const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  login,
  verifyToken,
  logout,
  getCurrentUser,
  refreshToken
} = require('../controllers/auth.controller');

// Ruta de login (pública - no requiere autenticación)
router.post('/login', login);

// Ruta para verificar token (pública - no requiere autenticación)
router.get('/verify', verifyToken);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/refresh', authMiddleware, refreshToken);

// Ruta de información general de autenticación
router.get('/', (req, res) => {
  res.json({
    message: '🔐 API de Autenticación - Sistema de Gestión de Empleados',
    version: '2.0.0',
    endpoints: {
      'POST /login': 'Iniciar sesión con DNI y contraseña',
      'GET /verify': 'Verificar token JWT',
      'POST /logout': 'Cerrar sesión (requiere token)',
      'GET /me': 'Obtener información del usuario actual (requiere token)',
      'POST /refresh': 'Renovar token JWT (requiere token)'
    },
    authentication: {
      type: 'JWT (JSON Web Token)',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      format: 'Bearer TOKEN en header Authorization'
    },
    notes: [
      'Para rutas protegidas, incluir: Authorization: Bearer <token>',
      'El token se genera automáticamente al hacer login',
      'El token expira según JWT_EXPIRES_IN en el .env'
    ]
  });
});

module.exports = router;
