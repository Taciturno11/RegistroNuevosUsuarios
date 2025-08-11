const express = require('express');
const router = express.Router();

// Ruta temporal - será implementada después
router.get('/', (req, res) => {
  res.json({
    message: '👥 API de Grupos - En desarrollo',
    status: 'coming_soon',
    note: 'Este módulo será implementado en la siguiente fase'
  });
});

module.exports = router;
