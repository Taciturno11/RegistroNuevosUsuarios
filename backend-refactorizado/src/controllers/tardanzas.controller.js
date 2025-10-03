const { executeQuery, sql } = require('../config/database');

// Función helper para parsear fechas locales correctamente
const parseFechaLocal = (fechaString) => {
  if (!fechaString) return null;
  
  // Si ya es un objeto Date, devolverlo
  if (fechaString instanceof Date) return fechaString;
  
  // Si es string "YYYY-MM-DD", crear Date en horario local a mediodía
  if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
    const [year, month, day] = fechaString.split('-').map(Number);
    // Crear fecha en horario local a mediodía (12:00 PM)
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  
  // Para otros formatos, usar new Date() normal
  return new Date(fechaString);
};

// ========================================
// REPORTE DE TARDANZAS
// ========================================

// Obtener reporte de tardanzas detallado
exports.getReporteTardanzas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, campania, cargo, supervisor } = req.query;
    
    // Validar parámetros
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas',
        error: 'MISSING_PARAMETERS'
      });
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

    // Consulta principal para tardanzas - SOLO PRIMERA MARCACIÓN DEL DÍA
    const query = `
      WITH PrimeraMarcacion AS (
          -- Obtener solo la primera marcación de cada empleado por día
          SELECT 
              r.Fecha,
              r.DNI,
              r.Nombres,
              r.ApellidoPaterno,
              r.HorarioEntrada,
              r.MarcacionReal,
              r.Estado,
              -- Ordenar por hora de marcación (más temprana primero)
              ROW_NUMBER() OVER (
                  PARTITION BY r.DNI, r.Fecha 
                  ORDER BY CAST(r.MarcacionReal AS TIME)
              ) as OrdenMarcacion
          FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] r
          WHERE r.Fecha BETWEEN @fechaInicio AND @fechaFin
      )
      SELECT 
          pm.Fecha,
          pm.DNI,
          pm.Nombres + ' ' + pm.ApellidoPaterno as NombreCompleto,
          pm.Nombres,
          pm.ApellidoPaterno,
          UPPER(c.NombreCampaña) as Campaña,
          UPPER(cg.NombreCargo) as Cargo,
          CONVERT(VARCHAR(8), pm.HorarioEntrada, 108) as HorarioEntrada,
          CONVERT(VARCHAR(8), pm.MarcacionReal, 108) as MarcacionReal,
          pm.Estado,
          -- Calcular minutos de tardanza
          CASE 
              WHEN pm.MarcacionReal > pm.HorarioEntrada 
              THEN DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)
              ELSE 0
          END as MinutosTardanza,
          -- Calcular tiempo de tardanza en formato HH:MM
          CASE 
              WHEN pm.MarcacionReal > pm.HorarioEntrada 
              THEN RIGHT('0' + CAST(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) / 60 AS VARCHAR(2)), 2) + ':' + 
                   RIGHT('0' + CAST(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) % 60 AS VARCHAR(2)), 2)
              ELSE '00:00'
          END as TiempoTardanza,
          -- Clasificar nivel de tardanza
          CASE 
              WHEN DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) <= 5 THEN 'Leve'
              WHEN DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) <= 15 THEN 'Moderada'
              WHEN DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) <= 30 THEN 'Grave'
              ELSE 'Muy Grave'
          END as NivelTardanza
      FROM PrimeraMarcacion pm
      INNER JOIN 
          [Partner].[PRI].[Empleados] e ON pm.DNI = e.DNI
      INNER JOIN 
          [Partner].[PRI].[Campanias] c ON e.CampañaID = c.CampañaID  
      INNER JOIN 
          [Partner].[PRI].[Cargos] cg ON e.CargoID = cg.CargoID
      WHERE 
          pm.OrdenMarcacion = 1  -- Solo la primera marcación del día
          AND pm.Estado = 'T'
          AND pm.MarcacionReal > pm.HorarioEntrada
          AND DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) > 0
          ${filtrosAdicionales}
      ORDER BY 
          pm.Fecha DESC, MinutosTardanza DESC, pm.ApellidoPaterno, pm.Nombres
    `;

    // Parsear fechas correctamente para evitar problemas de zona horaria
    const fechaInicioParsed = parseFechaLocal(fechaInicio);
    const fechaFinParsed = parseFechaLocal(fechaFin);
    
    console.log(`🔍 Fechas parseadas - Original: ${fechaInicio} → ${fechaFin}, Parseadas: ${fechaInicioParsed} → ${fechaFinParsed}`);

    const params = [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicioParsed },
      { name: 'fechaFin', type: sql.Date, value: fechaFinParsed },
      ...paramsAdicionales
    ];

    console.log(`🔍 Generando reporte de tardanzas desde ${fechaInicio} hasta ${fechaFin}`);
    console.log('🔍 Filtros aplicados:');
    console.log('  - Campaña:', campania);
    console.log('  - Cargo:', cargo);
    console.log('  - Supervisor:', supervisor);
    console.log('  - Filtros adicionales SQL:', filtrosAdicionales);
    console.log('📋 Parámetros:', params);
    console.log('📋 Consulta SQL:', query);
    
    // Verificar si hay datos en la tabla para las fechas especificadas
    const verificarQuery = `
      SELECT COUNT(*) as TotalRegistros
      FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] r
      WHERE r.Fecha BETWEEN @fechaInicio AND @fechaFin
    `;
    
    console.log('🔍 Verificando existencia de datos...');
    const verificarResult = await executeQuery(verificarQuery, [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicioParsed },
      { name: 'fechaFin', type: sql.Date, value: fechaFinParsed }
    ]);
    
    console.log(`📊 Total de registros en rango de fechas: ${verificarResult.recordset[0].TotalRegistros}`);
    
    // Verificar registros con Estado = 'T' (Tardanzas)
    const verificarTardanzasQuery = `
      SELECT COUNT(*) as TotalTardanzas
      FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] r
      WHERE r.Fecha BETWEEN @fechaInicio AND @fechaFin
      AND r.Estado = 'T'
    `;
    
    const verificarTardanzasResult = await executeQuery(verificarTardanzasQuery, [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicioParsed },
      { name: 'fechaFin', type: sql.Date, value: fechaFinParsed }
    ]);
    
    console.log(`📊 Total de registros con Estado = 'T': ${verificarTardanzasResult.recordset[0].TotalTardanzas}`);
    
    const result = await executeQuery(query, params);
    
    console.log('📊 Resultados obtenidos:', result.recordset.length);
    if (result.recordset.length > 0) {
      console.log('📋 Primer registro:', result.recordset[0]);
    }

    // Calcular estadísticas
    const tardanzas = result.recordset;
    const totalTardanzas = tardanzas.length;
    const empleadosUnicos = [...new Set(tardanzas.map(t => t.DNI))].length;
    const promedioMinutos = totalTardanzas > 0 ? 
      tardanzas.reduce((sum, t) => sum + t.MinutosTardanza, 0) / totalTardanzas : 0;
    
    // Estadísticas por nivel
    const estadisticasNivel = {
      'Leve': tardanzas.filter(t => t.NivelTardanza === 'Leve').length,
      'Moderada': tardanzas.filter(t => t.NivelTardanza === 'Moderada').length,
      'Grave': tardanzas.filter(t => t.NivelTardanza === 'Grave').length,
      'Muy Grave': tardanzas.filter(t => t.NivelTardanza === 'Muy Grave').length
    };

    // Top empleados con más tardanzas
    const tardanzasPorEmpleado = tardanzas.reduce((acc, t) => {
      const key = `${t.DNI}-${t.NombreCompleto}`;
      if (!acc[key]) {
        acc[key] = {
          DNI: t.DNI,
          NombreCompleto: t.NombreCompleto,
          Campaña: t.Campaña,
          Cargo: t.Cargo,
          totalTardanzas: 0,
          totalMinutos: 0
        };
      }
      acc[key].totalTardanzas++;
      acc[key].totalMinutos += t.MinutosTardanza;
      return acc;
    }, {});

    const topEmpleados = Object.values(tardanzasPorEmpleado)
      .sort((a, b) => b.totalTardanzas - a.totalTardanzas)
      .slice(0, 10);

    const metadata = {
      fechaInicio,
      fechaFin,
      totalTardanzas,
      empleadosUnicos,
      promedioMinutos: Math.round(promedioMinutos * 100) / 100,
      estadisticasNivel,
      topEmpleados
    };

    res.json({
      success: true,
      message: 'Reporte de tardanzas generado exitosamente',
      data: {
        tardanzas,
        metadata
      }
    });

  } catch (error) {
    console.error('❌ Error generando reporte de tardanzas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener reporte resumido por empleado
exports.getReporteResumido = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, campania, cargo, supervisor } = req.query;
    
    // Validar parámetros
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas',
        error: 'MISSING_PARAMETERS'
      });
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

    // Consulta para reporte resumido por empleado - SOLO PRIMERA MARCACIÓN DEL DÍA
    const query = `
      WITH PrimeraMarcacion AS (
          -- Obtener solo la primera marcación de cada empleado por día
          SELECT 
              r.Fecha,
              r.DNI,
              r.Nombres,
              r.ApellidoPaterno,
              r.HorarioEntrada,
              r.MarcacionReal,
              r.Estado,
              -- Ordenar por hora de marcación (más temprana primero)
              ROW_NUMBER() OVER (
                  PARTITION BY r.DNI, r.Fecha 
                  ORDER BY CAST(r.MarcacionReal AS TIME)
              ) as OrdenMarcacion
          FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] r
          WHERE r.Fecha BETWEEN @fechaInicio AND @fechaFin
      )
      SELECT 
          pm.DNI,
          pm.Nombres + ' ' + pm.ApellidoPaterno as NombreCompleto,
          UPPER(c.NombreCampaña) as Campaña,
          UPPER(cg.NombreCargo) as Cargo,
          COUNT(*) as TotalTardanzas,
          SUM(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)) as TotalMinutosTardanza,
          AVG(CAST(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) AS FLOAT)) as PromedioMinutosTardanza,
          MIN(pm.Fecha) as PrimeraTardanza,
          MAX(pm.Fecha) as UltimaTardanza,
          -- Clasificar por nivel de problema (considerando cantidad Y gravedad)
          CASE 
              -- Crítico: Muchas tardanzas O muchos minutos acumulados
              WHEN COUNT(*) >= 10 OR SUM(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)) >= 240 THEN 'Crítico'
              -- Alto: Varias tardanzas O bastantes minutos acumulados
              WHEN COUNT(*) >= 5 OR SUM(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)) >= 120 THEN 'Alto'
              -- Moderado: Algunas tardanzas O algunos minutos acumulados
              WHEN COUNT(*) >= 3 OR SUM(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)) >= 60 THEN 'Moderado'
              -- Bajo: Pocas tardanzas Y pocos minutos
              ELSE 'Bajo'
          END as NivelProblema
      FROM PrimeraMarcacion pm
      INNER JOIN 
          [Partner].[PRI].[Empleados] e ON pm.DNI = e.DNI
      INNER JOIN 
          [Partner].[PRI].[Campanias] c ON e.CampañaID = c.CampañaID  
      INNER JOIN 
          [Partner].[PRI].[Cargos] cg ON e.CargoID = cg.CargoID
      WHERE 
          pm.OrdenMarcacion = 1  -- Solo la primera marcación del día
          AND pm.Estado = 'T'
          AND pm.MarcacionReal > pm.HorarioEntrada
          AND DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) > 0
          ${filtrosAdicionales}
      GROUP BY 
          pm.DNI, pm.Nombres, pm.ApellidoPaterno, c.NombreCampaña, cg.NombreCargo
      ORDER BY 
          TotalTardanzas DESC, TotalMinutosTardanza DESC
    `;

    // Parsear fechas correctamente para evitar problemas de zona horaria
    const fechaInicioParsed = parseFechaLocal(fechaInicio);
    const fechaFinParsed = parseFechaLocal(fechaFin);
    
    console.log(`🔍 Fechas parseadas (Resumido) - Original: ${fechaInicio} → ${fechaFin}, Parseadas: ${fechaInicioParsed} → ${fechaFinParsed}`);

    const params = [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicioParsed },
      { name: 'fechaFin', type: sql.Date, value: fechaFinParsed },
      ...paramsAdicionales
    ];

    console.log(`🔍 Generando reporte RESUMIDO de tardanzas desde ${fechaInicio} hasta ${fechaFin}`);
    
    const result = await executeQuery(query, params);

    // Preparar metadatos
    const empleados = result.recordset;
    const totalEmpleados = empleados.length;
    const totalTardanzas = empleados.reduce((sum, emp) => sum + emp.TotalTardanzas, 0);
    const totalMinutos = empleados.reduce((sum, emp) => sum + emp.TotalMinutosTardanza, 0);

    const metadata = {
      fechaInicio,
      fechaFin,
      totalEmpleados,
      totalTardanzas,
      totalMinutos,
      promedioTardanzasPorEmpleado: totalEmpleados > 0 ? (totalTardanzas / totalEmpleados).toFixed(1) : 0,
      promedioMinutosPorEmpleado: totalEmpleados > 0 ? (totalMinutos / totalEmpleados).toFixed(1) : 0
    };

    res.json({
      success: true,
      message: 'Reporte resumido de tardanzas generado exitosamente',
      data: {
        empleados,
        metadata
      }
    });

  } catch (error) {
    console.error('❌ Error generando reporte resumido de tardanzas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas resumidas de tardanzas
exports.getEstadisticasTardanzas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas'
      });
    }

    const query = `
      WITH PrimeraMarcacion AS (
          -- Obtener solo la primera marcación de cada empleado por día
          SELECT 
              r.Fecha,
              r.DNI,
              r.HorarioEntrada,
              r.MarcacionReal,
              r.Estado,
              -- Ordenar por hora de marcación (más temprana primero)
              ROW_NUMBER() OVER (
                  PARTITION BY r.DNI, r.Fecha 
                  ORDER BY CAST(r.MarcacionReal AS TIME)
              ) as OrdenMarcacion
          FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] r
          WHERE r.Fecha BETWEEN @fechaInicio AND @fechaFin
      )
      SELECT 
          COUNT(*) as TotalTardanzas,
          COUNT(DISTINCT pm.DNI) as EmpleadosConTardanzas,
          AVG(CAST(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal) AS FLOAT)) as PromedioMinutos,
          MAX(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)) as MaximoMinutos,
          MIN(DATEDIFF(MINUTE, pm.HorarioEntrada, pm.MarcacionReal)) as MinimoMinutos,
          -- Tardanzas por día de la semana
          SUM(CASE WHEN DATEPART(WEEKDAY, pm.Fecha) = 2 THEN 1 ELSE 0 END) as TardanzasLunes,
          SUM(CASE WHEN DATEPART(WEEKDAY, pm.Fecha) = 3 THEN 1 ELSE 0 END) as TardanzasMartes,
          SUM(CASE WHEN DATEPART(WEEKDAY, pm.Fecha) = 4 THEN 1 ELSE 0 END) as TardanzasMiercoles,
          SUM(CASE WHEN DATEPART(WEEKDAY, pm.Fecha) = 5 THEN 1 ELSE 0 END) as TardanzasJueves,
          SUM(CASE WHEN DATEPART(WEEKDAY, pm.Fecha) = 6 THEN 1 ELSE 0 END) as TardanzasViernes
      FROM PrimeraMarcacion pm
      WHERE 
          pm.OrdenMarcacion = 1  -- Solo la primera marcación del día
          AND pm.Estado = 'T'
          AND pm.MarcacionReal > pm.HorarioEntrada
    `;

    // Parsear fechas correctamente para evitar problemas de zona horaria
    const fechaInicioParsed = parseFechaLocal(fechaInicio);
    const fechaFinParsed = parseFechaLocal(fechaFin);
    
    console.log(`🔍 Fechas parseadas (Estadísticas) - Original: ${fechaInicio} → ${fechaFin}, Parseadas: ${fechaInicioParsed} → ${fechaFinParsed}`);

    const params = [
      { name: 'fechaInicio', type: sql.Date, value: fechaInicioParsed },
      { name: 'fechaFin', type: sql.Date, value: fechaFinParsed }
    ];

    const result = await executeQuery(query, params);

    res.json({
      success: true,
      message: 'Estadísticas de tardanzas obtenidas exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de tardanzas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
