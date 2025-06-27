// src/routes/ojt.routes.js
const { Router } = require('express');
const {
  listarHistorial,
  crearOJT,
  actualizarOJT
} = require('../controllers/ojt.controller');

const router = Router();

/* Orden específico → de más concreto a más general */
router.get('/:dni/historial', listarHistorial);   // GET /ojt/72479081/historial
router.post('/',              crearOJT);         // POST /ojt
router.patch('/:id',          actualizarOJT);    // PATCH /ojt/162

module.exports = router;
