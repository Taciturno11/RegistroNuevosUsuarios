const { executeQuery, sql } = require('../config/database');

// ========================================
// REPORTE DE ASISTENCIAS
// ========================================

// Obtener reporte de asistencias por mes/año
exports.getReporteAsistencias = async (req, res) => {
  try {
    const { mes, anio, campania, cargo, supervisor } = req.query;
    
    // Validar parámetros
    if (!mes || !anio) {
      return res.status(400).json({
        success: false,
        message: 'Mes y año son requeridos',
        error: 'MISSING_PARAMETERS'
      });
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    // Validar rangos
    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12',
        error: 'INVALID_MONTH'
      });
    }

    if (anioNum < 2020 || anioNum > 2030) {
      return res.status(400).json({
        success: false,
        message: 'El año debe estar entre 2020 y 2030',
        error: 'INVALID_YEAR'
      });
    }

    // Calcular fechas del mes
    const fechaInicio = `${anioNum}-${mesNum.toString().padStart(2, '0')}-01`;
    const ultimoDiaDelMes = new Date(anioNum, mesNum, 0).getDate();
    const fechaFin = `${anioNum}-${mesNum.toString().padStart(2, '0')}-${ultimoDiaDelMes.toString().padStart(2, '0')}`;

    // Generar columnas dinámicamente para el mes seleccionado
    const columnasFechas = [];
    const columnasPivot = [];
    
    for (let dia = 1; dia <= ultimoDiaDelMes; dia++) {
      const fecha = `${anioNum}-${mesNum.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      columnasFechas.push(`AsistenciaPivotada.[${fecha}]`);
      columnasPivot.push(`[${fecha}]`);
    }

    // Construir filtros adicionales
    let filtrosAdicionales = '';
    const paramsAdicionales = [];
    
    if (campania && campania !== 'todas') {
      filtrosAdicionales += ' AND c.CampañaID = @campaniaID';
      paramsAdicionales.push({ name: 'campaniaID', type: sql.Int, value: parseInt(campania) });
    }
    
    if (cargo && cargo !== 'todos') {
      filtrosAdicionales += ' AND cg.CargoID = @cargoID';
      paramsAdicionales.push({ name: 'cargoID', type: sql.Int, value: parseInt(cargo) });
    }
    
    if (supervisor && supervisor !== 'todos') {
      filtrosAdicionales += ' AND e.SupervisorDNI = @supervisorDNI';
      paramsAdicionales.push({ name: 'supervisorDNI', type: sql.VarChar, value: supervisor });
    }

    // Construir la consulta SQL dinámicamente
    const query = `
      SELECT
          e.DNI,
          UPPER(e.ApellidoPaterno) AS ApellidoPaterno,
          UPPER(e.ApellidoMaterno) AS ApellidoMaterno,
          UPPER(e.Nombres) AS Nombres,
          UPPER(c.NombreCampaña) AS Campaña,
          UPPER(cg.NombreCargo) AS Cargo,
          UPPER(e.EstadoEmpleado) AS EstadoEmpleado,
          e.FechaContratacion,
          -- Columnas de asistencia dinámicas
          ${columnasFechas.join(', ')}
      FROM
          [Partner].[PRI].[Empleados] e
      LEFT JOIN (
          -- Subconsulta que pivotea los datos de asistencia
          SELECT
              DNI,
              ${columnasPivot.join(', ')}
          FROM (
              -- Origen de los datos: DNI, Fecha y Estado de la asistencia
              SELECT DNI, CONVERT(varchar, Fecha, 23) AS Fecha, Estado
              FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
              WHERE Fecha BETWEEN @fechaInicio AND @fechaFin
          ) AS SourceData
          PIVOT (
              MAX(Estado)
              FOR Fecha IN (
                  ${columnasPivot.join(', ')}
              )
          ) AS pvt
      ) AS AsistenciaPivotada ON e.DNI = AsistenciaPivotada.DNI
      LEFT JOIN [Partner].[PRI].[Campanias] c ON e.CampañaID = c.CampañaID
      LEFT JOIN [Partner].[PRI].[Cargos] cg ON e.CargoID = cg.CargoID
      -- Filtro para mostrar solo empleados activos durante el periodo seleccionado
      WHERE
          (e.FechaCese IS NULL OR e.FechaCese >= @fechaInicio) 
          AND e.FechaContratacion <= @fechaFin
          ${filtrosAdicionales}
      ORDER BY
          e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
    `;

    const params = [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicio },
      { name: 'fechaFin', type: sql.Date, value: fechaFin },
      ...paramsAdicionales
    ];

    console.log(`🔍 Generando reporte de asistencias para ${mesNum}/${anioNum}`);
    
    const result = await executeQuery(query, params);

    // Preparar metadatos del reporte
    const metadata = {
      mes: mesNum,
      anio: anioNum,
      fechaInicio,
      fechaFin,
      totalEmpleados: result.recordset.length,
      diasDelMes: ultimoDiaDelMes,
      fechasColumnas: columnasPivot.map(col => col.replace(/[\[\]]/g, ''))
    };

    res.json({
      success: true,
      message: 'Reporte de asistencias generado exitosamente',
      data: {
        empleados: result.recordset,
        metadata
      }
    });

  } catch (error) {
    console.error('❌ Error generando reporte de asistencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener años disponibles para reportes
exports.getAniosDisponibles = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT YEAR(Fecha) as anio
      FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
      WHERE Fecha IS NOT NULL
      ORDER BY anio DESC
    `;

    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Años disponibles obtenidos exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error obteniendo años disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener campañas disponibles
exports.getCampaniasDisponibles = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT c.CampañaID, c.NombreCampaña
      FROM [Partner].[PRI].[Campanias] c
      INNER JOIN [Partner].[PRI].[Empleados] e ON c.CampañaID = e.CampañaID
      WHERE e.EstadoEmpleado = 'ACTIVO'
      ORDER BY c.NombreCampaña
    `;

    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Campañas disponibles obtenidas exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error obteniendo campañas disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener cargos disponibles
exports.getCargosDisponibles = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT cg.CargoID, cg.NombreCargo
      FROM [Partner].[PRI].[Cargos] cg
      INNER JOIN [Partner].[PRI].[Empleados] e ON cg.CargoID = e.CargoID
      WHERE e.EstadoEmpleado = 'ACTIVO'
      ORDER BY cg.NombreCargo
    `;

    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Cargos disponibles obtenidos exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error obteniendo cargos disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener supervisores disponibles
exports.getSupervisoresDisponibles = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.DNI as SupervisorDNI,
        -- Formato: Primera letra mayúscula, resto minúscula
        UPPER(LEFT(s.ApellidoPaterno, 1)) + LOWER(SUBSTRING(s.ApellidoPaterno, 2, LEN(s.ApellidoPaterno))) + ' ' +
        UPPER(LEFT(s.ApellidoMaterno, 1)) + LOWER(SUBSTRING(s.ApellidoMaterno, 2, LEN(s.ApellidoMaterno))) + ', ' +
        UPPER(LEFT(s.Nombres, 1)) + LOWER(SUBSTRING(s.Nombres, 2, LEN(s.Nombres))) as NombreCompleto,
        ISNULL(COUNT(e.DNI), 0) as CantidadAgentes
      FROM [Partner].[PRI].[Empleados] s
      LEFT JOIN [Partner].[PRI].[Empleados] e ON s.DNI = e.SupervisorDNI AND e.EstadoEmpleado = 'ACTIVO'
      WHERE s.EstadoEmpleado = 'ACTIVO' 
        AND s.CargoID = 5  -- Solo empleados con CargoID = 5 (Supervisores)
      GROUP BY s.DNI, s.ApellidoPaterno, s.ApellidoMaterno, s.Nombres
      ORDER BY NombreCompleto
    `;

    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Supervisores disponibles obtenidos exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error obteniendo supervisores disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// GENERAR REPORTE DE ASISTENCIA MAESTRO
// ========================================

// Generar reporte de asistencia maestro (ejecuta SP crítico)
exports.generarReporteAsistencia = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;
    
    console.log('🚀 Generando reporte de asistencia maestro:', { fechaInicio, fechaFin });
    
    // Validar fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        success: false,
        message: 'Fechas de inicio y fin son requeridas',
        error: 'MISSING_DATES'
      });
    }

    // Validar que fechaInicio no sea mayor que fechaFin
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      return res.status(400).json({ 
        success: false,
        message: 'La fecha de inicio no puede ser mayor que la fecha de fin',
        error: 'INVALID_DATE_RANGE'
      });
    }

    // Validar formato de fechas
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    
    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de fecha inválido',
        error: 'INVALID_DATE_FORMAT'
      });
    }

    // Ejecutar el SP crítico con máximo cuidado
    const result = await executeQuery(
      'EXEC [dbo].[usp_GenerarReporteAsistenciaMaestro] @FechaInicio, @FechaFin',
      [
        { name: 'FechaInicio', type: sql.Date, value: fechaInicioDate },
        { name: 'FechaFin', type: sql.Date, value: fechaFinDate }
      ]
    );

    console.log('✅ SP ejecutado exitosamente. Registros afectados:', result.rowsAffected[0] || 0);

    res.json({ 
      success: true,
      message: 'Reporte de asistencia maestro generado exitosamente',
      data: {
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        registrosGenerados: result.rowsAffected[0] || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error crítico generando reporte de asistencia maestro:', error);
    
    // Log detallado del error para debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      state: error.state
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Error crítico al generar reporte de asistencia maestro',
      error: 'CRITICAL_SP_EXECUTION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};
