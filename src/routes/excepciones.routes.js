const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../controllers/auth.controller').authMiddleware;

const {
  obtenerHorarios,
  obtenerExcepciones,
  crearExcepcion,
  eliminarExcepcion
} = require('../controllers/excepciones.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Obtener horarios disponibles
router.get('/horarios', obtenerHorarios);

// Obtener excepciones de un empleado
router.get('/:dni', obtenerExcepciones);

// Crear nueva excepción
router.post('/', [
  body('EmpleadoDNI').notEmpty().withMessage('DNI es requerido'),
  body('Fecha').isDate().withMessage('Fecha válida es requerida'),
  body('HorarioID').optional().custom((value) => {
    // Permitir null para descanso
    if (value === null || value === undefined) {
      return true;
    }
    // Si no es null, debe ser un entero mayor a 0
    if (!Number.isInteger(Number(value)) || Number(value) < 1) {
      throw new Error('HorarioID debe ser un número entero válido o null para descanso');
    }
    return true;
  }).withMessage('HorarioID debe ser un número entero válido o null para descanso'),
  body('Motivo').notEmpty().withMessage('Motivo es requerido')
], crearExcepcion);

// Eliminar excepción
router.delete('/:id', eliminarExcepcion);

module.exports = router; 