const express = require('express');
const router = express.Router();
const { 
  testConnection, 
  testEmpleadosTable, 
  getDatabaseInfo 
} = require('../controllers/test.controller');

// Ruta para probar conexión básica
router.get('/connection', testConnection);

// Ruta para probar consulta a tabla empleados
router.get('/empleados', testEmpleadosTable);

// Ruta para obtener información de la base de datos
router.get('/database-info', getDatabaseInfo);

// Ruta raíz de prueba
router.get('/', (req, res) => {
  res.json({
    message: '🧪 Backend Refactorizado - Rutas de Prueba',
    endpoints: {
      'GET /test/connection': 'Probar conexión a base de datos',
      'GET /test/empleados': 'Probar consulta a tabla empleados',
      'GET /test/database-info': 'Obtener información de la BD'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
