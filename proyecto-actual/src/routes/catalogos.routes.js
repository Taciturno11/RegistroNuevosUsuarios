const { Router } = require('express');
const { listarCatalogos, listarGruposHorario } = require('../controllers/catalogos.controller');
const router = Router();

router.get('/', listarCatalogos);
router.get('/gruposh', listarGruposHorario);   // ?jornada=1

module.exports = router;
