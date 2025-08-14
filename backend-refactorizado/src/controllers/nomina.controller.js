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
