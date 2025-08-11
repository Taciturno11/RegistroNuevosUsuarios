const { executeQuery, sql } = require('../config/database');

// ========================================
// GESTIÓN DE JUSTIFICACIONES
// ========================================

// Obtener todas las justificaciones
exports.getAllJustificaciones = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', estado = '', fechaDesde = '', fechaHasta = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // Filtro de búsqueda
    if (search) {
      whereClause += ` AND (j.EmpleadoDNI LIKE @search OR e.Nombres LIKE @search OR e.ApellidoPaterno LIKE @search)`;
      params.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
    }

    // Filtro por estado
    if (estado) {
      whereClause += ` AND j.Estado = @estado`;
      params.push({ name: 'estado', type: sql.VarChar, value: estado });
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      whereClause += ` AND j.Fecha >= @fechaDesde`;
      params.push({ name: 'fechaDesde', type: sql.Date, value: new Date(fechaDesde) });
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      whereClause += ` AND j.Fecha <= @fechaHasta`;
      params.push({ name: 'fechaHasta', type: sql.Date, value: new Date(fechaHasta) });
    }

    // Consulta principal
    const query = `
      SELECT
        j.JustificacionID,
        j.EmpleadoDNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        j.Fecha,
        j.TipoJustificacion,
        j.Motivo,
        j.Estado,
        j.AprobadorDNI,
        aprobador.Nombres as NombreAprobador,
        aprobador.ApellidoPaterno as ApellidoAprobador
      FROM Partner.dbo.Justificaciones j
      LEFT JOIN PRI.Empleados e ON j.EmpleadoDNI = e.DNI
      LEFT JOIN PRI.Empleados aprobador ON j.AprobadorDNI = aprobador.DNI
      ${whereClause}
      ORDER BY j.Fecha DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    // Agregar parámetros de paginación
    params.push(
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: parseInt(limit) }
    );

    const result = await executeQuery(query, params);

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Partner.dbo.Justificaciones j
      LEFT JOIN PRI.Empleados e ON j.EmpleadoDNI = e.DNI
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, params.slice(0, -2));
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Justificaciones obtenidas exitosamente',
      data: {
        justificaciones: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo justificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener justificación por ID
exports.getJustificacionById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        j.JustificacionID,
        j.EmpleadoDNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        j.Fecha,
        j.TipoJustificacion,
        j.Motivo,
        j.Estado,
        j.AprobadorDNI,
        aprobador.Nombres as NombreAprobador,
        aprobador.ApellidoPaterno as ApellidoAprobador
      FROM Partner.dbo.Justificaciones j
      LEFT JOIN PRI.Empleados e ON j.EmpleadoDNI = e.DNI
      LEFT JOIN PRI.Empleados aprobador ON j.AprobadorDNI = aprobador.DNI
      WHERE j.JustificacionID = @JustificacionID
    `;

    const result = await executeQuery(query, [
      { name: 'JustificacionID', type: sql.Int, value: parseInt(id) }
    ]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Justificación no encontrada',
        error: 'JUSTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Justificación obtenida exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo justificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener justificaciones por empleado
exports.getJustificacionesByEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        j.JustificacionID,
        j.Fecha,
        j.TipoJustificacion,
        j.Motivo,
        j.Estado,
        j.AprobadorDNI,
        aprobador.Nombres as NombreAprobador,
        aprobador.ApellidoPaterno as ApellidoAprobador
      FROM Partner.dbo.Justificaciones j
      LEFT JOIN PRI.Empleados aprobador ON j.AprobadorDNI = aprobador.DNI
      WHERE j.EmpleadoDNI = @EmpleadoDNI
      ORDER BY j.Fecha DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await executeQuery(query, [
      { name: 'EmpleadoDNI', type: sql.VarChar, value: dni },
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: parseInt(limit) }
    ]);

    // Obtener total de justificaciones del empleado
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Partner.dbo.Justificaciones
      WHERE EmpleadoDNI = @EmpleadoDNI
    `;

    const countResult = await executeQuery(countQuery, [
      { name: 'EmpleadoDNI', type: sql.VarChar, value: dni }
    ]);

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Justificaciones del empleado obtenidas exitosamente',
      data: {
        justificaciones: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo justificaciones del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nueva justificación
exports.createJustificacion = async (req, res) => {
  try {
    const {
      empleadoDNI,
      fecha,
      tipoJustificacion,
      motivo,
      estado = 'Pendiente'
    } = req.body;

    // Validar campos requeridos
    if (!empleadoDNI || !fecha || !tipoJustificacion || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'DNI del empleado, fecha, tipo y motivo son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar que el empleado existe
    const empleadoQuery = 'SELECT DNI FROM PRI.Empleados WHERE DNI = @DNI';
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'DNI', type: sql.VarChar, value: empleadoDNI }
    ]);

    if (empleadoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Insertar justificación
    const insertQuery = `
      INSERT INTO Partner.dbo.Justificaciones (
        EmpleadoDNI, Fecha, TipoJustificacion, Motivo, Estado
      ) VALUES (
        @EmpleadoDNI, @Fecha, @TipoJustificacion, @Motivo, @Estado
      )
    `;

    const params = [
      { name: 'EmpleadoDNI', type: sql.VarChar, value: empleadoDNI },
      { name: 'Fecha', type: sql.Date, value: new Date(fecha) },
      { name: 'TipoJustificacion', type: sql.VarChar, value: tipoJustificacion },
      { name: 'Motivo', type: sql.VarChar, value: motivo },
      { name: 'Estado', type: sql.VarChar, value: estado }
    ];

    await executeQuery(insertQuery, params);

    console.log(`✅ Justificación creada exitosamente para: ${empleadoDNI}`);

    res.status(201).json({
      success: true,
      message: 'Justificación creada exitosamente',
      data: {
        empleadoDNI,
        fecha: new Date(fecha),
        tipoJustificacion,
        motivo,
        estado
      }
    });

  } catch (error) {
    console.error('❌ Error creando justificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Aprobar/Rechazar justificación
exports.aprobarJustificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivoRechazo = null } = req.body;
    const aprobadorDNI = req.user.dni; // Usuario que aprueba/rechaza

    // Validar estado
    if (!['Aprobada', 'Rechazada'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado debe ser "Aprobada" o "Rechazada"',
        error: 'INVALID_STATUS'
      });
    }

    // Verificar que la justificación existe
    const justificacionQuery = 'SELECT JustificacionID, Estado FROM Partner.dbo.Justificaciones WHERE JustificacionID = @JustificacionID';
    const justificacionResult = await executeQuery(justificacionQuery, [
      { name: 'JustificacionID', type: sql.Int, value: parseInt(id) }
    ]);

    if (justificacionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Justificación no encontrada',
        error: 'JUSTIFICATION_NOT_FOUND'
      });
    }

    const justificacion = justificacionResult.recordset[0];

    if (justificacion.Estado !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aprobar/rechazar justificaciones pendientes',
        error: 'INVALID_STATUS_CHANGE'
      });
    }

    // Actualizar justificación
    const updateQuery = `
      UPDATE Partner.dbo.Justificaciones 
      SET 
        Estado = @Estado,
        AprobadorDNI = @AprobadorDNI
      WHERE JustificacionID = @JustificacionID
    `;

    await executeQuery(updateQuery, [
      { name: 'Estado', type: sql.VarChar, value: estado },
      { name: 'AprobadorDNI', type: sql.VarChar, value: aprobadorDNI },
      { name: 'JustificacionID', type: sql.Int, value: parseInt(id) }
    ]);

    console.log(`✅ Justificación ${estado.toLowerCase()} exitosamente: ${id}`);

    res.json({
      success: true,
      message: `Justificación ${estado.toLowerCase()} exitosamente`,
      data: {
        justificacionID: parseInt(id),
        estado,
        aprobadorDNI,
        motivoRechazo
      }
    });

  } catch (error) {
    console.error('❌ Error aprobando justificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas de justificaciones
exports.getEstadisticasJustificaciones = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    let fechaFiltro = '';
    if (periodo === 'mes') {
      fechaFiltro = 'AND j.Fecha >= DATEADD(MONTH, -1, GETDATE())';
    } else if (periodo === 'trimestre') {
      fechaFiltro = 'AND j.Fecha >= DATEADD(MONTH, -3, GETDATE())';
    } else if (periodo === 'año') {
      fechaFiltro = 'AND j.Fecha >= DATEADD(YEAR, -1, GETDATE())';
    }

    const statsQuery = `
      SELECT
        COUNT(*) as totalJustificaciones,
        COUNT(CASE WHEN j.Estado = 'Pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN j.Estado = 'Aprobada' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN j.Estado = 'Rechazada' THEN 1 END) as rechazadas,
        COUNT(CASE WHEN j.Fecha >= DATEADD(MONTH, -1, GETDATE()) THEN 1 END) as ultimoMes
      FROM Partner.dbo.Justificaciones j
      WHERE 1=1
      ${fechaFiltro}
    `;

    const result = await executeQuery(statsQuery);

    res.json({
      success: true,
      message: 'Estadísticas de justificaciones obtenidas exitosamente',
      data: {
        estadisticas: result.recordset[0],
        periodo: periodo
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de justificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
