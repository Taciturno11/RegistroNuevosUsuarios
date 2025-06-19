const { Router } = require('express');
const { body } = require('express-validator');
const { crearEmpleado, lookupEmpleados } = require('../controllers/empleados.controller');
const router = Router();

// Autocompletar: /empleados/lookup?cargo=5&search=7156
router.get('/lookup', lookupEmpleados);

// Crear
router.post('/',
  [
    body('DNI')
      .isLength({ min: 1, max: 12 }).withMessage('El DNI debe tener hasta 12 dígitos')
      .isNumeric().withMessage('El DNI solo debe contener números'),
    body('Nombres').notEmpty(),
    body('ApellidoPaterno').notEmpty(),
    body('FechaContratacion').isISO8601().toDate(),
    body('JornadaID').isInt(),
    body('CampañaID').isInt(),
    body('CargoID').isInt(),
    body('ModalidadID').isInt(),
    body('GrupoHorarioID').isInt()
  ],
  crearEmpleado
);

module.exports = router;
