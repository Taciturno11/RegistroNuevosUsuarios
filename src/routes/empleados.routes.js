const { Router } = require('express');
const { body } = require('express-validator');
const { crearEmpleado, lookupEmpleados, obtenerEmpleado, actualizarEmpleado, obtenerHorarioEmpleado } = require('../controllers/empleados.controller');
const router = Router();

// Autocompletar: /empleados/lookup?cargo=5&search=7156
router.get('/lookup', lookupEmpleados);

// Obtener empleado por DNI
router.get('/:dni', obtenerEmpleado);

// Obtener horario del empleado
router.get('/:dni/horario', obtenerHorarioEmpleado);

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

// Actualizar
router.put('/:dni',
  [
    body('Nombres').notEmpty(),
    body('ApellidoPaterno').notEmpty(),
    body('FechaContratacion').isISO8601().toDate(),
    body('JornadaID').isInt(),
    body('CampañaID').isInt(),
    body('CargoID').isInt(),
    body('ModalidadID').isInt(),
    body('GrupoHorarioID').isInt()
  ],
  actualizarEmpleado
);

module.exports = router;
