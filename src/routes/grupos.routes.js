const { Router } = require('express');
const {
  listarBases,          // /grupos
  listarDescansos,      // /grupos/:base
  listarBasesConHoras   // /grupos/horas   ← nuevo
} = require('../controllers/grupos.controller');

const router = Router();

router.get('/',      listarBases);          // 32 grupos base
router.get('/horas', listarBasesConHoras);  // 32 grupos + rango horario
router.get('/:base', listarDescansos);      // 7 descansos de ese grupo

module.exports = router;
