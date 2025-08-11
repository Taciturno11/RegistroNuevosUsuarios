const { executeQuery, executeStoredProcedure, sql } = require('../config/database');

// ========================================
// GESTIÓN DE REPORTES
// ========================================

// Generar reporte de asistencia maestro
exports.generarReporteAsistencia = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;
    
    console.log('📊 Generando reporte de asistencia:', { fechaInicio, fechaFin });
    
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

    // Validar que las fechas no sean del futuro
    const hoy = new Date();
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    
    if (fechaInicioDate > hoy || fechaFinDate > hoy) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden generar reportes para fechas futuras',
        error: 'FUTURE_DATES_NOT_ALLOWED'
      });
    }

    // Validar que el rango de fechas no sea mayor a 1 año
    const diffTime = Math.abs(fechaFinDate - fechaInicioDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'El rango de fechas no puede ser mayor a 1 año',
        error: 'DATE_RANGE_TOO_LARGE'
      });
    }

    console.log(`📅 Rango de fechas válido: ${fechaInicio} a ${fechaFin} (${diffDays} días)`);
    
    // Ejecutar el stored procedure
    const result = await executeStoredProcedure(
      '[dbo].[usp_GenerarReporteAsistenciaMaestro]',
      [
        { name: 'FechaInicio', type: sql.Date, value: fechaInicioDate },
        { name: 'FechaFin', type: sql.Date, value: fechaFinDate }
      ]
    );

    console.log('✅ Stored procedure ejecutado exitosamente');
    console.log(`📊 Registros procesados: ${result.rowsAffected[0] || 0}`);

    res.json({
      success: true,
      message: 'Reporte de asistencia generado exitosamente',
      data: {
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        registrosGenerados: result.rowsAffected[0] || 0,
        rangoDias: diffDays,
        fechaGeneracion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generando reporte de asistencia:', error);
    
    // Manejar errores específicos del stored procedure
    if (error.message && error.message.includes('usp_GenerarReporteAsistenciaMaestro')) {
      return res.status(500).json({
        success: false,
        message: 'Error ejecutando el stored procedure de reporte',
        error: 'STORED_PROCEDURE_ERROR',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al generar reporte',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener información del stored procedure
exports.getStoredProcedureInfo = async (req, res) => {
  try {
    console.log('ℹ️ Obteniendo información del stored procedure de reportes');
    
    // Consultar información del SP
    const spQuery = `
      SELECT 
        ROUTINE_NAME,
        ROUTINE_DEFINITION,
        CREATED,
        LAST_ALTERED
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_NAME = 'usp_GenerarReporteAsistenciaMaestro'
        AND ROUTINE_TYPE = 'PROCEDURE'
    `;
    
    const result = await executeQuery(spQuery);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stored procedure no encontrado',
        error: 'SP_NOT_FOUND'
      });
    }

    const spInfo = result.recordset[0];
    
    res.json({
      success: true,
      message: 'Información del stored procedure obtenida',
      data: {
        nombre: spInfo.ROUTINE_NAME,
        creado: spInfo.CREATED,
        ultimaModificacion: spInfo.LAST_ALTERED,
        disponible: true
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo información del SP:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas de reportes generados
exports.getEstadisticasReportes = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de reportes');
    
    // Por ahora retornamos información básica
    // En el futuro se podría implementar un log de reportes generados
    res.json({
      success: true,
      message: 'Estadísticas de reportes obtenidas',
      data: {
        totalReportesGenerados: 'N/A', // Se implementaría con un log
        ultimoReporte: 'N/A',
        reportesEsteMes: 'N/A',
        reportesEsteAno: 'N/A',
        storedProcedureDisponible: true,
        fechaUltimaVerificacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
