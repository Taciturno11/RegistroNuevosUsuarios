const { executeQuery, sql } = require('../config/database');

// ========================================
// GESTIÓN DE OJT (ON-THE-JOB TRAINING) / CIC
// ========================================

// Obtener lista de DNIs de empleados activos para autocomplete
exports.listarDNIsOJT = async (req, res) => {
  try {
    const query = `
      SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno
      FROM PRI.Empleados
      WHERE FechaCese IS NULL
      ORDER BY DNI
    `;

    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'DNIs de empleados activos obtenidos exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error al listar DNIs OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener historial OJT por DNI de empleado
exports.listarHistorial = async (req, res) => {
  try {
    const { dni } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Consulta principal con paginación
    const query = `
      SELECT  
        UsoCICID,
        NombreUsuarioCIC,
        DNIEmpleado,
        CONVERT(varchar(19), FechaHoraInicio, 120) AS FechaHoraInicio,
        CONVERT(varchar(19), FechaHoraFin, 120) AS FechaHoraFin,
        Observaciones
      FROM PRI.UsoUsuarioCIC
      WHERE DNIEmpleado = @DNI
      ORDER BY FechaHoraInicio DESC
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
      FROM PRI.UsoUsuarioCIC
      WHERE DNIEmpleado = @DNI
    `;

    const countResult = await executeQuery(countQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Historial OJT obtenido exitosamente',
      data: {
        historial: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error listar historial OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nuevo registro OJT
exports.crearOJT = async (req, res) => {
  try {
    const {
      UsuarioCIC,
      DNIEmpleado,
      FechaHoraInicio,          // string "2025-06-28 01:00:00"
      FechaHoraFin = null,
      Observaciones = null
    } = req.body;

    // Validar campos requeridos
    if (!UsuarioCIC || !DNIEmpleado || !FechaHoraInicio) {
      return res.status(400).json({
        success: false,
        message: 'Usuario CIC, DNI del empleado y fecha de inicio son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que el empleado existe y está activo
    const empleadoQuery = 'SELECT DNI FROM PRI.Empleados WHERE DNI = @DNI AND FechaCese IS NULL';
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'DNI', type: sql.VarChar, value: DNIEmpleado }
    ]);

    if (empleadoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o está inactivo',
        error: 'EMPLOYEE_NOT_FOUND_OR_INACTIVE'
      });
    }

    // Insertar nuevo registro OJT
    const insertQuery = `
      INSERT INTO PRI.UsoUsuarioCIC (
        NombreUsuarioCIC, DNIEmpleado, FechaHoraInicio,
        FechaHoraFin, Observaciones
      ) VALUES (
        @UsuarioCIC, @DNIEmpleado,
        CONVERT(datetime, @FechaHoraInicio, 120),
        CASE
          WHEN @FechaHoraFin IS NULL OR @FechaHoraFin = ''
          THEN NULL
          ELSE CONVERT(datetime, @FechaHoraFin, 120)
        END,
        @Observaciones
      )
    `;

    const params = [
      { name: 'UsuarioCIC', type: sql.VarChar, value: UsuarioCIC },
      { name: 'DNIEmpleado', type: sql.VarChar, value: DNIEmpleado },
      { name: 'FechaHoraInicio', type: sql.VarChar, value: FechaHoraInicio },
      { name: 'FechaHoraFin', type: sql.VarChar, value: FechaHoraFin },
      { name: 'Observaciones', type: sql.VarChar, value: Observaciones }
    ];

    await executeQuery(insertQuery, params);

    console.log(`✅ Registro OJT creado exitosamente para: ${DNIEmpleado}`);

    res.status(201).json({
      success: true,
      message: 'Registro OJT creado exitosamente',
      data: {
        DNIEmpleado,
        UsuarioCIC,
        FechaHoraInicio,
        FechaHoraFin,
        Observaciones
      }
    });

  } catch (error) {
    console.error('❌ Error crear OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Actualizar registro OJT existente
exports.actualizarOJT = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      UsuarioCIC,
      FechaHoraInicio,
      FechaHoraFin,
      Observaciones
    } = req.body;

    // Validar campos requeridos
    if (!UsuarioCIC || !FechaHoraInicio) {
      return res.status(400).json({
        success: false,
        message: 'Usuario CIC y fecha de inicio son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que el registro existe
    const registroQuery = 'SELECT UsoCICID FROM PRI.UsoUsuarioCIC WHERE UsoCICID = @ID';
    const registroResult = await executeQuery(registroQuery, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    if (registroResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro OJT no encontrado',
        error: 'OJT_RECORD_NOT_FOUND'
      });
    }

    // Actualizar registro
    const updateQuery = `
      UPDATE PRI.UsoUsuarioCIC
      SET 
        NombreUsuarioCIC = @UsuarioCIC,
        FechaHoraInicio = CONVERT(datetime, @FechaHoraInicio, 120),
        FechaHoraFin = CASE
          WHEN @FechaHoraFin IS NULL OR @FechaHoraFin = ''
          THEN NULL
          ELSE CONVERT(datetime, @FechaHoraFin, 120)
        END,
        Observaciones = @Observaciones
      WHERE UsoCICID = @ID
    `;

    const params = [
      { name: 'UsuarioCIC', type: sql.VarChar, value: UsuarioCIC },
      { name: 'FechaHoraInicio', type: sql.VarChar, value: FechaHoraInicio },
      { name: 'FechaHoraFin', type: sql.VarChar, value: FechaHoraFin },
      { name: 'Observaciones', type: sql.VarChar, value: Observaciones },
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ];

    await executeQuery(updateQuery, params);

    console.log(`✅ Registro OJT actualizado exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Registro OJT actualizado exitosamente',
      data: {
        UsoCICID: parseInt(id),
        UsuarioCIC,
        FechaHoraInicio,
        FechaHoraFin,
        Observaciones
      }
    });

  } catch (error) {
    console.error('❌ Error actualizar OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Eliminar registro OJT
exports.eliminarOJT = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el registro existe
    const registroQuery = 'SELECT UsoCICID FROM PRI.UsoUsuarioCIC WHERE UsoCICID = @ID';
    const registroResult = await executeQuery(registroQuery, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    if (registroResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro OJT no encontrado',
        error: 'OJT_RECORD_NOT_FOUND'
      });
    }

    // Eliminar registro
    const deleteQuery = 'DELETE FROM PRI.UsoUsuarioCIC WHERE UsoCICID = @ID';
    await executeQuery(deleteQuery, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    console.log(`✅ Registro OJT eliminado exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Registro OJT eliminado correctamente',
      data: {
        UsoCICID: parseInt(id)
      }
    });

  } catch (error) {
    console.error('❌ Error eliminar OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas de OJT
exports.getEstadisticasOJT = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    let fechaFiltro = '';
    if (periodo === 'mes') {
      fechaFiltro = 'AND FechaHoraInicio >= DATEADD(MONTH, -1, GETDATE())';
    } else if (periodo === 'trimestre') {
      fechaFiltro = 'AND FechaHoraInicio >= DATEADD(MONTH, -3, GETDATE())';
    } else if (periodo === 'año') {
      fechaFiltro = 'AND FechaHoraInicio >= DATEADD(YEAR, -1, GETDATE())';
    }

    const statsQuery = `
      SELECT
        COUNT(*) as totalRegistros,
        COUNT(CASE WHEN FechaHoraFin IS NULL THEN 1 END) as registrosActivos,
        COUNT(CASE WHEN FechaHoraFin IS NOT NULL THEN 1 END) as registrosCompletados,
        COUNT(CASE WHEN FechaHoraInicio >= DATEADD(MONTH, -1, GETDATE()) THEN 1 END) as ultimoMes
      FROM PRI.UsoUsuarioCIC
      WHERE 1=1
      ${fechaFiltro}
    `;

    const result = await executeQuery(statsQuery);

    res.json({
      success: true,
      message: 'Estadísticas de OJT obtenidas exitosamente',
      data: {
        estadisticas: result.recordset[0],
        periodo: periodo
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener registro OJT por ID
exports.getOJTById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT  
        UsoCICID,
        NombreUsuarioCIC,
        DNIEmpleado,
        CONVERT(varchar(19), FechaHoraInicio, 120) AS FechaHoraInicio,
        CONVERT(varchar(19), FechaHoraFin, 120) AS FechaHoraFin,
        Observaciones
      FROM PRI.UsoUsuarioCIC
      WHERE UsoCICID = @ID
    `;

    const result = await executeQuery(query, [
      { name: 'ID', type: sql.Int, value: parseInt(id) }
    ]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro OJT no encontrado',
        error: 'OJT_RECORD_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Registro OJT obtenido exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo registro OJT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
