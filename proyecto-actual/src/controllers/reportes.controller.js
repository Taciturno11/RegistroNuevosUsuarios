const { sql, pool } = require('../db');

// Generar reporte de asistencia maestro
exports.generarReporteAsistencia = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;
    
    console.log('Generando reporte de asistencia:', { fechaInicio, fechaFin });
    
    // Validar fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Validar que fechaInicio no sea mayor que fechaFin
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      return res.status(400).json({ error: 'La fecha de inicio no puede ser mayor que la fecha de fin' });
    }

    const conn = await pool;
    
    // Ejecutar el SP directamente
    const result = await conn.request()
      .input('FechaInicio', sql.Date, fechaInicio)
      .input('FechaFin', sql.Date, fechaFin)
      .execute('[dbo].[usp_GenerarReporteAsistenciaMaestro]');

    console.log('SP ejecutado exitosamente');

    res.json({ 
      mensaje: 'Reporte de asistencia generado exitosamente',
      fechaInicio,
      fechaFin,
      registrosGenerados: result.rowsAffected[0] || 0
    });

  } catch (err) {
    console.error('Error generando reporte de asistencia:', err);
    res.status(500).json({ error: 'Error al generar reporte de asistencia: ' + err.message });
  }
}; 