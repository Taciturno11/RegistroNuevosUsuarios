const { executeQuery, sql } = require('../config/database');

// ========================================
// GESTIÓN DE CESE DE EMPLEADOS
// ========================================

// Obtener todos los ceses
exports.getAllCeses = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', fechaDesde = '', fechaHasta = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE e.EstadoEmpleado = \'Inactivo\'';
    let params = [];

    // Filtro de búsqueda
    if (search) {
      whereClause += ` AND (e.DNI LIKE @search OR e.Nombres LIKE @search OR e.ApellidoPaterno LIKE @search)`;
      params.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      whereClause += ` AND e.FechaCese >= @fechaDesde`;
      params.push({ name: 'fechaDesde', type: sql.Date, value: new Date(fechaDesde) });
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      whereClause += ` AND e.FechaCese <= @fechaHasta`;
      params.push({ name: 'fechaHasta', type: sql.Date, value: new Date(fechaHasta) });
    }

    // Consulta principal
    const query = `
      SELECT
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.FechaContratacion,
        e.FechaCese,
        e.EstadoEmpleado,
        c.NombreCargo,
        camp.NombreCampaña,
        j.NombreJornada
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      ${whereClause}
      ORDER BY e.FechaCese DESC
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
      FROM PRI.Empleados e
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, params.slice(0, -2));
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Ceses obtenidos exitosamente',
      data: {
        ceses: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo ceses:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener cese por DNI
exports.getCeseByDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    const query = `
      SELECT
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.FechaContratacion,
        e.FechaCese,
        e.EstadoEmpleado,
        c.NombreCargo,
        camp.NombreCampaña,
        j.NombreJornada,
        m.NombreModalidad
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      WHERE e.DNI = @DNI AND e.EstadoEmpleado = 'Inactivo'
    `;

    const result = await executeQuery(query, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cese no encontrado o empleado no está inactivo',
        error: 'CESE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Cese obtenido exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo cese:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Procesar cese de empleado
exports.procesarCese = async (req, res) => {
  try {
    const { dni } = req.params;
    const { motivoCese, fechaCese, observaciones } = req.body;

    // Validar campos requeridos
    if (!motivoCese || !fechaCese) {
      return res.status(400).json({
        success: false,
        message: 'Motivo de cese y fecha son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar si el empleado existe y está activo
    const empleadoQuery = 'SELECT DNI, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI';
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

    const empleado = empleadoResult.recordset[0];

    if (empleado.EstadoEmpleado === 'Inactivo') {
      return res.status(400).json({
        success: false,
        message: 'El empleado ya está inactivo',
        error: 'EMPLOYEE_ALREADY_INACTIVE'
      });
    }

    // Procesar el cese
    const ceseQuery = `
      UPDATE PRI.Empleados 
      SET 
        EstadoEmpleado = 'Inactivo',
        FechaCese = @FechaCese
      WHERE DNI = @DNI
    `;

    await executeQuery(ceseQuery, [
      { name: 'FechaCese', type: sql.Date, value: new Date(fechaCese) },
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    // Aquí podrías insertar en una tabla de historial de ceses si la tuvieras
    // Por ahora solo actualizamos el estado del empleado

    console.log(`✅ Cese procesado exitosamente para: ${dni} - Motivo: ${motivoCese}`);

    res.json({
      success: true,
      message: 'Cese procesado exitosamente',
      data: {
        dni,
        estado: 'Inactivo',
        fechaCese: new Date(fechaCese),
        motivoCese,
        observaciones
      }
    });

  } catch (error) {
    console.error('❌ Error procesando cese:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Reactivar empleado (cambiar estado de Inactivo a Activo)
exports.reactivarEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;
    const { motivoReactivacion, fechaReactivacion } = req.body;

    // Verificar si el empleado existe y está inactivo
    const empleadoQuery = 'SELECT DNI, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI';
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

    const empleado = empleadoResult.recordset[0];

    if (empleado.EstadoEmpleado === 'Activo') {
      return res.status(400).json({
        success: false,
        message: 'El empleado ya está activo',
        error: 'EMPLOYEE_ALREADY_ACTIVE'
      });
    }

    // Reactivar empleado
    const reactivarQuery = `
      UPDATE PRI.Empleados 
      SET 
        EstadoEmpleado = 'Activo',
        FechaCese = NULL
      WHERE DNI = @DNI
    `;

    await executeQuery(reactivarQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    console.log(`✅ Empleado reactivado exitosamente: ${dni}`);

    res.json({
      success: true,
      message: 'Empleado reactivado exitosamente',
      data: {
        dni,
        estado: 'Activo',
        fechaReactivacion: fechaReactivacion || new Date(),
        motivoReactivacion
      }
    });

  } catch (error) {
    console.error('❌ Error reactivando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas de ceses
exports.getEstadisticasCeses = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    let fechaFiltro = '';
    if (periodo === 'mes') {
      fechaFiltro = 'AND e.FechaCese >= DATEADD(MONTH, -1, GETDATE())';
    } else if (periodo === 'trimestre') {
      fechaFiltro = 'AND e.FechaCese >= DATEADD(MONTH, -3, GETDATE())';
    } else if (periodo === 'año') {
      fechaFiltro = 'AND e.FechaCese >= DATEADD(YEAR, -1, GETDATE())';
    }

    const statsQuery = `
      SELECT
        COUNT(*) as totalCeses,
        COUNT(CASE WHEN e.FechaCese >= DATEADD(MONTH, -1, GETDATE()) THEN 1 END) as cesesUltimoMes,
        COUNT(CASE WHEN e.FechaCese >= DATEADD(MONTH, -3, GETDATE()) THEN 1 END) as cesesUltimoTrimestre,
        COUNT(CASE WHEN e.FechaCese >= DATEADD(YEAR, -1, GETDATE()) THEN 1 END) as cesesUltimoAño
      FROM PRI.Empleados e
      WHERE e.EstadoEmpleado = 'Inactivo'
      ${fechaFiltro}
    `;

    const result = await executeQuery(statsQuery);

    res.json({
      success: true,
      message: 'Estadísticas de ceses obtenidas exitosamente',
      data: {
        estadisticas: result.recordset[0],
        periodo: periodo
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de ceses:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Registrar cese de empleado (solo fecha, como en el proyecto original)
exports.registrarCese = async (req, res) => {
  try {
    const { dni } = req.params;
    const { fechaCese } = req.body;

    console.log(`🔍 Registrando cese para empleado: ${dni}, fecha: ${fechaCese}`);

    // Validar fecha requerida
    if (!fechaCese) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de cese es requerida',
        error: 'MISSING_FECHA_CESE'
      });
    }

    // Verificar si el empleado existe y está activo
    const empleadoQuery = 'SELECT DNI, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI';
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

    const empleado = empleadoResult.recordset[0];
    console.log(`🔍 Estado actual del empleado: ${empleado.EstadoEmpleado}`);

    if (empleado.EstadoEmpleado === 'Inactivo') {
      console.log(`❌ Empleado ya está inactivo: ${dni}`);
      return res.status(400).json({
        success: false,
        message: 'El empleado ya está inactivo',
        error: 'EMPLOYEE_ALREADY_INACTIVE'
      });
    }

    if (empleado.EstadoEmpleado === 'Cese') {
      console.log(`❌ Empleado ya está en cese: ${dni}`);
      return res.status(400).json({
        success: false,
        message: 'El empleado ya está en cese',
        error: 'EMPLOYEE_ALREADY_IN_CESE'
      });
    }

    // Registrar el cese (solo fecha, sin motivo ni observaciones)
    const ceseQuery = `
      UPDATE PRI.Empleados 
      SET 
        EstadoEmpleado = 'Cese',
        FechaCese = @FechaCese
      WHERE DNI = @DNI
    `;

    console.log(`🔍 Query SQL: ${ceseQuery}`);
    console.log(`🔍 Parámetros: DNI=${dni}, FechaCese=${fechaCese}`);

    await executeQuery(ceseQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni },
      { name: 'FechaCese', type: sql.Date, value: new Date(fechaCese) }
    ]);

    console.log(`✅ Cese registrado exitosamente para empleado: ${dni}`);
    
    // Verificar que se actualizó correctamente
    const verifyQuery = 'SELECT DNI, EstadoEmpleado, FechaCese FROM PRI.Empleados WHERE DNI = @DNI';
    const verifyResult = await executeQuery(verifyQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);
    
    if (verifyResult.recordset.length > 0) {
      const empleadoVerificado = verifyResult.recordset[0];
      console.log(`🔍 Verificación: DNI=${empleadoVerificado.DNI}, Estado=${empleadoVerificado.EstadoEmpleado}, FechaCese=${empleadoVerificado.FechaCese}`);
    }

    res.json({
      success: true,
      message: 'Cese registrado exitosamente',
      data: { dni, fechaCese, estado: 'Cese' }
    });

  } catch (error) {
    console.error('❌ Error registrando cese:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Anular cese de empleado (reactivar)
exports.anularCese = async (req, res) => {
  try {
    const { dni } = req.params;

    console.log(`🔍 Anulando cese para empleado: ${dni}`);

    // Verificar si el empleado existe
    const empleadoQuery = 'SELECT DNI, EstadoEmpleado, FechaCese FROM PRI.Empleados WHERE DNI = @DNI';
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (empleadoResult.recordset.length === 0) {
      console.log(`❌ Empleado no encontrado: ${dni}`);
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    const empleado = empleadoResult.recordset[0];
    console.log(`🔍 Estado actual del empleado: ${empleado.EstadoEmpleado}`);

    if (empleado.EstadoEmpleado === 'Activo') {
      console.log(`❌ Empleado ya está activo: ${dni}`);
      return res.status(400).json({
        success: false,
        message: 'El empleado ya está activo',
        error: 'EMPLOYEE_ALREADY_ACTIVE'
      });
    }

    // Verificar que el empleado esté en estado 'Cese'
    if (empleado.EstadoEmpleado !== 'Cese') {
      console.log(`❌ Empleado no está en estado de cese: ${dni}, estado actual: ${empleado.EstadoEmpleado}`);
      return res.status(400).json({
        success: false,
        message: `El empleado no está en estado de cese (estado actual: ${empleado.EstadoEmpleado})`,
        error: 'EMPLOYEE_NOT_IN_CESE_STATE'
      });
    }

    // Anular el cese (reactivar empleado)
    const reactivarQuery = `
      UPDATE PRI.Empleados 
      SET 
        EstadoEmpleado = 'Activo',
        FechaCese = NULL
      WHERE DNI = @DNI
    `;

    await executeQuery(reactivarQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    console.log(`✅ Cese anulado exitosamente para empleado: ${dni}`);

    res.json({
      success: true,
      message: 'Cese anulado exitosamente',
      data: { dni, estado: 'Activo' }
    });

  } catch (error) {
    console.error('❌ Error anulando cese:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
