const { executeQuery, sql } = require('../config/database');

// Generar reporte de nómina y asistencia
exports.generarReporteNomina = async (req, res) => {
  try {
    const { anio, mes } = req.query;
    
    if (!anio || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros año y mes son requeridos',
        error: 'MISSING_PARAMETERS'
      });
    }

    console.log(`📊 Generando reporte de nómina - Año: ${anio}, Mes: ${mes}`);

    // Ejecutar el stored procedure
    const result = await executeQuery(
      'EXEC [PRI].[GenerarReporteNominaYAsistencia] @Anio = @anio, @Mes = @mes',
      [
        { name: 'anio', type: sql.Int, value: parseInt(anio) },
        { name: 'mes', type: sql.Int, value: parseInt(mes) }
      ]
    );

    console.log(`✅ Reporte generado exitosamente - ${result.recordset.length} registros`);
    
    // Log de la primera fila para ver las columnas disponibles
    if (result.recordset.length > 0) {
      console.log('🔍 Columnas disponibles en el resultado:');
      console.log(Object.keys(result.recordset[0]));
      console.log('📋 Primera fila de datos:');
      console.log(result.recordset[0]);
    }

    res.json({
      success: true,
      message: 'Reporte de nómina generado exitosamente',
      data: {
        registros: result.recordset,
        totalRegistros: result.recordset.length,
        anio: parseInt(anio),
        mes: parseInt(mes)
      }
    });

  } catch (error) {
    console.error('❌ Error generando reporte de nómina:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando reporte de nómina',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
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
