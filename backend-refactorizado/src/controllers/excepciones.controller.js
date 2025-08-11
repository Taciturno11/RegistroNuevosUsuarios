const { executeQuery, sql } = require('../config/database');

// ========================================
// GESTIÓN DE ASIGNACIÓN DE EXCEPCIONES
// ========================================

// Obtener horarios disponibles
exports.obtenerHorarios = async (req, res) => {
  try {
    console.log('📋 Obteniendo horarios disponibles...');
    
    const query = `
      SELECT 
        HorarioID, 
        NombreHorario, 
        HoraEntrada, 
        HoraSalida, 
        MinutosToleranciaEntrada, 
        HorasJornada
      FROM dbo.Horarios_Base
      ORDER BY NombreHorario
    `;

    const result = await executeQuery(query);
    
    console.log(`✅ ${result.recordset.length} horarios obtenidos exitosamente`);
    
    res.json({
      success: true,
      message: 'Horarios obtenidos exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener excepciones de un empleado
exports.obtenerExcepciones = async (req, res) => {
  try {
    const { dni } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    console.log(`📋 Obteniendo excepciones para empleado: ${dni}`);

    // Verificar que el empleado existe
    const empleadoQuery = 'SELECT DNI FROM PRI.Empleados WHERE DNI = @DNI';
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (empleadoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Consulta principal con paginación
    const query = `
      SELECT 
        ae.AsignacionID, 
        ae.EmpleadoDNI, 
        ae.Fecha, 
        ae.HorarioID, 
        ae.Motivo,
        hb.HoraEntrada,
        hb.HoraSalida,
        hb.NombreHorario
      FROM dbo.AsignacionExcepciones ae
      LEFT JOIN dbo.Horarios_Base hb ON ae.HorarioID = hb.HorarioID
      WHERE ae.EmpleadoDNI = @DNI
      ORDER BY ae.Fecha DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const params = [
      { name: 'DNI', type: sql.VarChar, value: dni },
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: parseInt(limit) }
    ];

    const result = await executeQuery(query, params);

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dbo.AsignacionExcepciones
      WHERE EmpleadoDNI = @DNI
    `;

    const countResult = await executeQuery(countQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    const total = countResult.recordset[0].total;

    console.log(`✅ ${result.recordset.length} excepciones obtenidas para empleado: ${dni}`);

    res.json({
      success: true,
      message: 'Excepciones obtenidas exitosamente',
      data: {
        excepciones: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo excepciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nueva excepción
exports.crearExcepcion = async (req, res) => {
  try {
    const { EmpleadoDNI, Fecha, HorarioID, Motivo } = req.body;

    console.log(`📝 Creando nueva excepción para empleado: ${EmpleadoDNI}`);

    // Validar campos requeridos
    if (!EmpleadoDNI || !Fecha || !Motivo) {
      return res.status(400).json({
        success: false,
        message: 'DNI del empleado, fecha y motivo son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que el empleado existe
    const empleadoQuery = 'SELECT DNI FROM PRI.Empleados WHERE DNI = @DNI';
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'DNI', type: sql.VarChar, value: EmpleadoDNI }
    ]);

    if (empleadoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Verificar que el horario existe (solo si no es descanso)
    if (HorarioID !== null && HorarioID !== undefined) {
      const horarioQuery = 'SELECT HorarioID FROM dbo.Horarios_Base WHERE HorarioID = @HorarioID';
      const horarioResult = await executeQuery(horarioQuery, [
        { name: 'HorarioID', type: sql.Int, value: HorarioID }
      ]);

      if (horarioResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado',
          error: 'SCHEDULE_NOT_FOUND'
        });
      }
    }

    // Verificar que no existe una excepción para esa fecha
    const excepcionQuery = `
      SELECT 1 FROM dbo.AsignacionExcepciones 
      WHERE EmpleadoDNI = @DNI AND Fecha = @Fecha
    `;
    
    const excepcionResult = await executeQuery(excepcionQuery, [
      { name: 'DNI', type: sql.VarChar, value: EmpleadoDNI },
      { name: 'Fecha', type: sql.Date, value: new Date(Fecha) }
    ]);

    if (excepcionResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una excepción para esta fecha',
        error: 'DUPLICATE_EXCEPTION'
      });
    }

    // Verificar que la fecha no sea muy antigua (más de 1 mes)
    const fechaActual = new Date();
    const fechaUnMesAtras = new Date();
    fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);
    const fechaExcepcion = new Date(Fecha);
    
    if (fechaExcepcion < fechaUnMesAtras) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden crear excepciones para fechas anteriores a 1 mes',
        error: 'DATE_TOO_OLD'
      });
    }

    // Insertar la excepción
    const insertQuery = `
      INSERT INTO dbo.AsignacionExcepciones (EmpleadoDNI, Fecha, HorarioID, Motivo)
      VALUES (@EmpleadoDNI, @Fecha, @HorarioID, @Motivo);
      
      SELECT SCOPE_IDENTITY() AS AsignacionID;
    `;

    const params = [
      { name: 'EmpleadoDNI', type: sql.VarChar, value: EmpleadoDNI },
      { name: 'Fecha', type: sql.Date, value: new Date(Fecha) },
      { name: 'HorarioID', type: sql.Int, value: HorarioID || null },
      { name: 'Motivo', type: sql.VarChar, value: Motivo }
    ];

    const result = await executeQuery(insertQuery, params);
    const nuevaExcepcionID = result.recordset[0].AsignacionID;

    console.log(`✅ Excepción creada exitosamente con ID: ${nuevaExcepcionID}`);

    res.status(201).json({
      success: true,
      message: 'Excepción creada exitosamente',
      data: {
        AsignacionID: nuevaExcepcionID,
        EmpleadoDNI,
        Fecha,
        HorarioID,
        Motivo
      }
    });

  } catch (error) {
    console.error('❌ Error creando excepción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Actualizar excepción existente
exports.actualizarExcepcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { HorarioID, Motivo } = req.body;

    console.log(`📝 Actualizando excepción con ID: ${id}`);

    // Validar campos requeridos
    if (!Motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo es requerido',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que la excepción existe
    const excepcionQuery = 'SELECT AsignacionID FROM dbo.AsignacionExcepciones WHERE AsignacionID = @ID';
    const excepcionResult = await executeQuery(excepcionQuery, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    if (excepcionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Excepción no encontrada',
        error: 'EXCEPTION_NOT_FOUND'
      });
    }

    // Verificar que el horario existe (solo si no es descanso)
    if (HorarioID !== null && HorarioID !== undefined) {
      const horarioQuery = 'SELECT HorarioID FROM dbo.Horarios_Base WHERE HorarioID = @HorarioID';
      const horarioResult = await executeQuery(horarioQuery, [
        { name: 'HorarioID', type: sql.Int, value: HorarioID }
      ]);

      if (horarioResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado',
          error: 'SCHEDULE_NOT_FOUND'
        });
      }
    }

    // Actualizar la excepción
    const updateQuery = `
      UPDATE dbo.AsignacionExcepciones
      SET HorarioID = @HorarioID, Motivo = @Motivo
      WHERE AsignacionID = @ID
    `;

    const params = [
      { name: 'HorarioID', type: sql.Int, value: HorarioID || null },
      { name: 'Motivo', type: sql.VarChar, value: Motivo },
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ];

    await executeQuery(updateQuery, params);

    console.log(`✅ Excepción actualizada exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Excepción actualizada exitosamente',
      data: {
        AsignacionID: parseInt(id),
        HorarioID,
        Motivo
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando excepción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Eliminar excepción
exports.eliminarExcepcion = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Eliminando excepción con ID: ${id}`);

    // Verificar que la excepción existe
    const excepcionQuery = 'SELECT AsignacionID FROM dbo.AsignacionExcepciones WHERE AsignacionID = @ID';
    const excepcionResult = await executeQuery(excepcionQuery, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    if (excepcionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Excepción no encontrada',
        error: 'EXCEPTION_NOT_FOUND'
      });
    }

    // Eliminar la excepción
    const deleteQuery = 'DELETE FROM dbo.AsignacionExcepciones WHERE AsignacionID = @ID';
    await executeQuery(deleteQuery, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    console.log(`✅ Excepción eliminada exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Excepción eliminada exitosamente',
      data: {
        AsignacionID: parseInt(id)
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando excepción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener excepción por ID
exports.getExcepcionById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 Obteniendo excepción con ID: ${id}`);

    const query = `
      SELECT 
        ae.AsignacionID, 
        ae.EmpleadoDNI, 
        ae.Fecha, 
        ae.HorarioID, 
        ae.Motivo,
        hb.HoraEntrada,
        hb.HoraSalida,
        hb.NombreHorario
      FROM dbo.AsignacionExcepciones ae
      LEFT JOIN dbo.Horarios_Base hb ON ae.HorarioID = hb.HorarioID
      WHERE ae.AsignacionID = @ID
    `;

    const result = await executeQuery(query, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Excepción no encontrada',
        error: 'EXCEPTION_NOT_FOUND'
      });
    }

    console.log(`✅ Excepción obtenida exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Excepción obtenida exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo excepción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas de excepciones
exports.getEstadisticasExcepciones = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    console.log(`📊 Obteniendo estadísticas de excepciones para período: ${periodo}`);

    let fechaFiltro = '';
    if (periodo === 'mes') {
      fechaFiltro = 'AND ae.Fecha >= DATEADD(MONTH, -1, GETDATE())';
    } else if (periodo === 'trimestre') {
      fechaFiltro = 'AND ae.Fecha >= DATEADD(MONTH, -3, GETDATE())';
    } else if (periodo === 'año') {
      fechaFiltro = 'AND ae.Fecha >= DATEADD(YEAR, -1, GETDATE())';
    }

    const statsQuery = `
      SELECT
        COUNT(*) as totalExcepciones,
        COUNT(CASE WHEN ae.HorarioID IS NULL THEN 1 END) as descansos,
        COUNT(CASE WHEN ae.HorarioID IS NOT NULL THEN 1 END) as cambiosHorario,
        COUNT(CASE WHEN ae.Fecha >= DATEADD(MONTH, -1, GETDATE()) THEN 1 END) as ultimoMes
      FROM dbo.AsignacionExcepciones ae
      WHERE 1=1
      ${fechaFiltro}
    `;

    const result = await executeQuery(statsQuery);

    console.log(`✅ Estadísticas de excepciones obtenidas exitosamente`);

    res.json({
      success: true,
      message: 'Estadísticas de excepciones obtenidas exitosamente',
      data: {
        estadisticas: result.recordset[0],
        periodo: periodo
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de excepciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
