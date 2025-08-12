const { executeQuery, sql } = require('../config/database');

// ========================================
// REPORTE DE ASISTENCIAS
// ========================================

// Obtener reporte de asistencias por mes/año
exports.getReporteAsistencias = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    
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
      ORDER BY
          e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
    `;

    const params = [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicio },
      { name: 'fechaFin', type: sql.Date, value: fechaFin }
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
