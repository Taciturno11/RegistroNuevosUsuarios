const { validationResult } = require('express-validator');
const { pool, sql } = require('../db');

// Obtener horarios disponibles
exports.obtenerHorarios = async (req, res) => {
  try {
    console.log('Obteniendo horarios...');
    const conn = await pool;
    console.log('Conexión obtenida');
    
    const request = conn.request();
    const result = await request.query(`
      SELECT HorarioID, NombreHorario, HoraEntrada, HoraSalida, 
             MinutosToleranciaEntrada, HorasJornada
      FROM Horarios_Base
      ORDER BY NombreHorario
    `);

    console.log('Horarios obtenidos:', result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error obteniendo horarios:', err);
    res.status(500).json({ error: 'Error al obtener horarios: ' + err.message });
  }
};

// Obtener excepciones de un empleado
exports.obtenerExcepciones = async (req, res) => {
  const { dni } = req.params;
  
  try {
    const conn = await pool;
    const result = await conn.request()
      .input('DNI', sql.VarChar(12), dni)
      .query(`
        SELECT 
          ae.AsignacionID, 
          ae.EmpleadoDNI, 
          ae.Fecha, 
          ae.HorarioID, 
          ae.Motivo,
          hb.HoraEntrada,
          hb.HoraSalida
        FROM AsignacionExcepciones ae
        LEFT JOIN Horarios_Base hb ON ae.HorarioID = hb.HorarioID
        WHERE ae.EmpleadoDNI = @DNI
        ORDER BY ae.Fecha DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error obteniendo excepciones:', err);
    res.status(500).json({ error: 'Error al obtener excepciones' });
  }
};

// Crear nueva excepción
exports.crearExcepcion = async (req, res) => {
  // Validaciones
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { EmpleadoDNI, Fecha, HorarioID, Motivo } = req.body;

  try {
    const conn = await pool;
    
    // Verificar que el empleado existe
    const empleadoExiste = await conn.request()
      .input('DNI', sql.VarChar(12), EmpleadoDNI)
      .query('SELECT 1 FROM PRI.Empleados WHERE DNI = @DNI');
    
    if (empleadoExiste.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar que el horario existe (solo si no es descanso)
    if (HorarioID !== null) {
      const horarioExiste = await conn.request()
        .input('HorarioID', sql.Int, HorarioID)
        .query('SELECT 1 FROM Horarios_Base WHERE HorarioID = @HorarioID');
      
      if (horarioExiste.recordset.length === 0) {
        return res.status(404).json({ error: 'Horario no encontrado' });
      }
    }

    // Verificar que no existe una excepción para esa fecha
    const excepcionExiste = await conn.request()
      .input('DNI', sql.VarChar(12), EmpleadoDNI)
      .input('Fecha', sql.Date, Fecha)
      .query(`
        SELECT 1 FROM AsignacionExcepciones 
        WHERE EmpleadoDNI = @DNI AND Fecha = @Fecha
      `);
    
    if (excepcionExiste.recordset.length > 0) {
      return res.status(409).json({ error: 'Ya existe una excepción para esta fecha' });
    }

    // Verificar que la fecha no sea muy antigua (más de 1 mes)
    const fechaActual = new Date();
    const fechaUnMesAtras = new Date();
    fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);
    const fechaExcepcion = new Date(Fecha);
    
    if (fechaExcepcion < fechaUnMesAtras) {
      return res.status(400).json({ error: 'No se pueden crear excepciones para fechas anteriores a 1 mes' });
    }

    // Insertar la excepción
    const result = await conn.request()
      .input('EmpleadoDNI', sql.VarChar(12), EmpleadoDNI)
      .input('Fecha', sql.Date, Fecha)
      .input('HorarioID', sql.Int, HorarioID)
      .input('Motivo', sql.VarChar(500), Motivo)
      .query(`
        INSERT INTO AsignacionExcepciones (EmpleadoDNI, Fecha, HorarioID, Motivo)
        VALUES (@EmpleadoDNI, @Fecha, @HorarioID, @Motivo);
        
        SELECT SCOPE_IDENTITY() AS AsignacionID;
      `);

    const nuevaExcepcion = {
      AsignacionID: result.recordset[0].AsignacionID,
      EmpleadoDNI,
      Fecha,
      HorarioID,
      Motivo
    };

    res.status(201).json(nuevaExcepcion);
  } catch (err) {
    console.error('Error creando excepción:', err);
    res.status(500).json({ error: 'Error al crear excepción' });
  }
};

// Eliminar excepción
exports.eliminarExcepcion = async (req, res) => {
  const { id } = req.params;
  
  try {
    const conn = await pool;
    
    // Verificar que la excepción existe
    const excepcionExiste = await conn.request()
      .input('AsignacionID', sql.Int, id)
      .query('SELECT 1 FROM AsignacionExcepciones WHERE AsignacionID = @AsignacionID');
    
    if (excepcionExiste.recordset.length === 0) {
      return res.status(404).json({ error: 'Excepción no encontrada' });
    }

    // Eliminar la excepción
    await conn.request()
      .input('AsignacionID', sql.Int, id)
      .query('DELETE FROM AsignacionExcepciones WHERE AsignacionID = @AsignacionID');

    res.json({ mensaje: 'Excepción eliminada exitosamente' });
  } catch (err) {
    console.error('Error eliminando excepción:', err);
    res.status(500).json({ error: 'Error al eliminar excepción' });
  }
}; 