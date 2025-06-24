// src/routes/cese.routes.js
const { Router } = require('express');
const {
  listarDNIsActivos,
  obtenerPorDNI,
  registrarCese
} = require('../controllers/cese.controller');

const router = Router();

// API endpoints de cese
router.get('/dnis', listarDNIsActivos);     // GET /cese/dnis
router.get('/:dni', obtenerPorDNI);         // GET /cese/:dni
router.put('/:dni', registrarCese);         // PUT /cese/:dni

module.exports = router;
