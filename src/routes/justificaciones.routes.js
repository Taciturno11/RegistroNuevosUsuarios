const { Router } = require('express');
const {
  listarDNIsJustificacion,
  obtenerEmpleadoJustificacion,
  listarTiposJustificacion,
  obtenerJefeDirecto,
  registrarJustificacion
} = require('../controllers/justificaciones.controller');

const router = Router();

// 🔧 El orden es CRÍTICO: lo más específico va primero
router.get('/dnis', listarDNIsJustificacion);
router.get('/tipos', listarTiposJustificacion);
router.get('/:dni/jefe', obtenerJefeDirecto);
router.get('/:dni', obtenerEmpleadoJustificacion);
router.post('/', registrarJustificacion);

module.exports = router;
