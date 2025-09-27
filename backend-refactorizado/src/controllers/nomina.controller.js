const { executeQuery, sql } = require('../config/database');

// Generar reporte de nómina y asistencia
exports.generarReporteNomina = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { anio, mes } = req.query;
    
    if (!anio || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros año y mes son requeridos',
        error: 'MISSING_PARAMETERS'
      });
    }

    console.log(`📊 Iniciando generación de reporte de nómina - Año: ${anio}, Mes: ${mes}`);
    console.log(`⏰ Timestamp de inicio: ${new Date().toISOString()}`);

    // Ejecutar el stored procedure con timeout extendido
    const result = await executeQuery(
      'EXEC [PRI].[GenerarReporteNominaYAsistencia] @Anio = @anio, @Mes = @mes',
      [
        { name: 'anio', type: sql.Int, value: parseInt(anio) },
        { name: 'mes', type: sql.Int, value: parseInt(mes) }
      ]
    );

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;

    console.log(`✅ Reporte generado exitosamente en ${executionTime.toFixed(2)} segundos`);
    console.log(`📊 Total de registros: ${result.recordset.length}`);
    
    // Log de la primera fila para ver las columnas disponibles
    if (result.recordset.length > 0) {
      console.log('🔍 Columnas disponibles en el resultado:');
      console.log(Object.keys(result.recordset[0]));
      console.log('📋 Primera fila de datos:');
      console.log(result.recordset[0]);
    } else {
      console.log('⚠️ No se encontraron registros para el período seleccionado');
    }

    res.json({
      success: true,
      message: `Reporte de nómina generado exitosamente en ${executionTime.toFixed(2)} segundos`,
      data: {
        registros: result.recordset,
        totalRegistros: result.recordset.length,
        anio: parseInt(anio),
        mes: parseInt(mes),
        tiempoEjecucion: executionTime
      }
    });

  } catch (error) {
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.error('❌ Error generando reporte de nómina:', error);
    console.error(`⏰ Tiempo transcurrido antes del error: ${executionTime.toFixed(2)} segundos`);
    
    // Manejar diferentes tipos de errores
    let errorMessage = 'Error generando reporte de nómina';
    let statusCode = 500;
    
    if (error.message && error.message.includes('timeout')) {
      errorMessage = 'El reporte está tardando más de lo esperado. Por favor, intente nuevamente.';
      statusCode = 408; // Request Timeout
    } else if (error.message && error.message.includes('connection')) {
      errorMessage = 'Error de conexión con la base de datos. Verifique la conectividad.';
      statusCode = 503; // Service Unavailable
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message,
      tiempoEjecucion: executionTime
    });
  }
};

// Obtener años disponibles para reportes de nómina
exports.getAniosDisponibles = async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT DISTINCT YEAR(GETDATE()) - 2 as anio UNION SELECT DISTINCT YEAR(GETDATE()) - 1 UNION SELECT DISTINCT YEAR(GETDATE()) UNION SELECT DISTINCT YEAR(GETDATE()) + 1 ORDER BY anio DESC'
    );

    const anios = result.recordset.map(row => row.anio);

    res.json({
      success: true,
      data: anios
    });

  } catch (error) {
    console.error('❌ Error obteniendo años disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo años disponibles',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Endpoint de diagnóstico para verificar el estado del sistema
exports.diagnosticoSistema = async (req, res) => {
  try {
    console.log('🔍 Ejecutando diagnóstico del sistema de nómina...');
    
    const startTime = Date.now();
    
    // Verificar conexión a la base de datos
    const connectionTest = await executeQuery('SELECT 1 as test');
    
    // Verificar si existe el stored procedure
    const spExists = await executeQuery(`
      SELECT COUNT(*) as existe 
      FROM sys.procedures 
      WHERE name = 'GenerarReporteNominaYAsistencia' 
      AND schema_id = SCHEMA_ID('PRI')
    `);
    
    // Verificar cantidad de empleados activos
    const empleadosActivos = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM PRI.Empleados 
      WHERE EstadoEmpleado = 'Activo'
    `);
    
    // Verificar cantidad de registros de asistencia (último mes)
    const asistenciaUltimoMes = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM PRI.Asistencia 
      WHERE YEAR(Fecha) = YEAR(GETDATE()) 
      AND MONTH(Fecha) = MONTH(GETDATE())
    `);
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    res.json({
      success: true,
      message: 'Diagnóstico completado exitosamente',
      data: {
        conexionBD: connectionTest.recordset[0].test === 1 ? 'OK' : 'ERROR',
        storedProcedureExiste: spExists.recordset[0].existe > 0,
        empleadosActivos: empleadosActivos.recordset[0].total,
        registrosAsistenciaUltimoMes: asistenciaUltimoMes.recordset[0].total,
        tiempoEjecucion: executionTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando diagnóstico',
      error: error.message
    });
  }
};

// Obtener todas las campañas disponibles en la base de datos
exports.getTodasLasCampanias = async (req, res) => {
  try {
    console.log('🔍 Obteniendo todas las campañas disponibles en la base de datos...');

    // Consulta para obtener todas las campañas de la tabla PRI.Campanias
    const queryTodasCampanias = `
      SELECT CampañaID, NombreCampaña 
      FROM PRI.Campanias 
      ORDER BY NombreCampaña
    `;

    // Consulta para obtener campañas que aparecen en reportes de nómina (últimos 3 meses)
    const queryCampaniasEnNomina = `
      SELECT DISTINCT c.NombreCampaña
      FROM PRI.Campanias c
      INNER JOIN PRI.Empleados e ON c.CampañaID = e.CampañaID
      WHERE e.EstadoEmpleado IN ('Activo', 'Cese')
      ORDER BY c.NombreCampaña
    `;

    // Consulta para obtener campañas que aparecen en capacitaciones
    const queryCampaniasEnCapacitaciones = `
      SELECT DISTINCT c.NombreCampaña
      FROM PRI.Campanias c
      INNER JOIN Postulantes_En_Formacion pf ON c.CampañaID = pf.CampañaID
      ORDER BY c.NombreCampaña
    `;

    const [todasCampanias, campaniasEnNomina, campaniasEnCapacitaciones] = await Promise.all([
      executeQuery(queryTodasCampanias),
      executeQuery(queryCampaniasEnNomina),
      executeQuery(queryCampaniasEnCapacitaciones)
    ]);

    console.log('📊 Resultados obtenidos:');
    console.log('🔍 Todas las campañas en PRI.Campanias:', todasCampanias.recordset.map(c => c.NombreCampaña));
    console.log('🔍 Campañas en nómina:', campaniasEnNomina.recordset.map(c => c.NombreCampaña));
    console.log('🔍 Campañas en capacitaciones:', campaniasEnCapacitaciones.recordset.map(c => c.NombreCampaña));

    res.json({
      success: true,
      message: 'Campañas obtenidas exitosamente',
      data: {
        todasLasCampanias: todasCampanias.recordset,
        campaniasEnNomina: campaniasEnNomina.recordset,
        campaniasEnCapacitaciones: campaniasEnCapacitaciones.recordset,
        totalCampanias: todasCampanias.recordset.length,
        campaniasEnNominaCount: campaniasEnNomina.recordset.length,
        campaniasEnCapacitacionesCount: campaniasEnCapacitaciones.recordset.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo campañas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo campañas',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};
