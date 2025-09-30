const { executeQuery, sql } = require('../config/database');
const { parseFechaLocal } = require('../utils/dateUtils');

// Obtener sueldo base actual de un empleado
exports.getSueldoBase = async (req, res) => {
  try {
    const { dni } = req.params;
    
    console.log('💰 Obteniendo sueldo base para empleado:', dni);
    
    const query = `
      SELECT TOP 1 
        SueldoID, 
        EmpleadoDNI, 
        MontoMensual, 
        FechaVigencia
      FROM PRI.SueldoBase 
      WHERE EmpleadoDNI = @dni
      ORDER BY FechaVigencia DESC
    `;
    
    const result = await executeQuery(query, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);
    
    console.log(`✅ Sueldo base encontrado: ${result.recordset.length > 0 ? 'Sí' : 'No'}`);
    
    res.json({
      success: true,
      message: 'Sueldo base obtenido exitosamente',
      data: result.recordset[0] || null
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo sueldo base:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo sueldo base',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Obtener historial de sueldos base de un empleado
exports.getHistorialSueldos = async (req, res) => {
  try {
    const { dni } = req.params;
    
    console.log('📊 Obteniendo historial de sueldos para empleado:', dni);
    
    const query = `
      SELECT 
        SueldoID, 
        EmpleadoDNI, 
        MontoMensual, 
        FechaVigencia
      FROM PRI.SueldoBase 
      WHERE EmpleadoDNI = @dni
      ORDER BY FechaVigencia DESC
    `;
    
    const result = await executeQuery(query, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);
    
    console.log(`✅ Historial de sueldos encontrado: ${result.recordset.length} registros`);
    
    res.json({
      success: true,
      message: 'Historial de sueldos obtenido exitosamente',
      data: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo historial de sueldos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de sueldos',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Actualizar sueldo base de un empleado
exports.actualizarSueldoBase = async (req, res) => {
  try {
    const { EmpleadoDNI, MontoMensual, FechaVigencia } = req.body;
    
    console.log('💰 Actualizando sueldo base:', {
      EmpleadoDNI,
      MontoMensual,
      FechaVigencia
    });
    
    // Validaciones
    if (!EmpleadoDNI || !MontoMensual || !FechaVigencia) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        error: 'MISSING_FIELDS'
      });
    }
    
    if (parseFloat(MontoMensual) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0',
        error: 'INVALID_AMOUNT'
      });
    }
    
    // Verificar que el empleado existe
    const empleadoQuery = `
      SELECT DNI FROM PRI.Empleados WHERE DNI = @dni
    `;
    
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'dni', type: sql.VarChar, value: EmpleadoDNI }
    ]);
    
    if (empleadoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }
    
    // Insertar nuevo sueldo base
    const insertQuery = `
      INSERT INTO PRI.SueldoBase (EmpleadoDNI, MontoMensual, FechaVigencia)
      VALUES (@dni, @monto, @fecha)
    `;
    
    // Usar parseFechaLocal para evitar problemas de zona horaria
    const fechaVigencia = parseFechaLocal(FechaVigencia) || new Date(FechaVigencia);
    
    await executeQuery(insertQuery, [
      { name: 'dni', type: sql.VarChar, value: EmpleadoDNI },
      { name: 'monto', type: sql.Decimal(10, 2), value: parseFloat(MontoMensual) },
      { name: 'fecha', type: sql.Date, value: fechaVigencia }
    ]);
    
    console.log('✅ Sueldo base actualizado exitosamente');
    
    res.json({
      success: true,
      message: 'Sueldo base actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando sueldo base:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando sueldo base',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Obtener estadísticas de sueldos de un empleado
exports.getEstadisticasSueldos = async (req, res) => {
  try {
    const { dni } = req.params;
    
    console.log('📊 Obteniendo estadísticas de sueldos para empleado:', dni);
    
    const query = `
      SELECT 
        COUNT(*) as TotalCambios,
        AVG(MontoMensual) as PromedioSueldo,
        MIN(MontoMensual) as SueldoMinimo,
        MAX(MontoMensual) as SueldoMaximo,
        MIN(FechaVigencia) as PrimeraFecha,
        MAX(FechaVigencia) as UltimaFecha
      FROM PRI.SueldoBase 
      WHERE EmpleadoDNI = @dni
    `;
    
    const result = await executeQuery(query, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);
    
    const estadisticas = result.recordset[0];
    
    console.log('✅ Estadísticas obtenidas:', estadisticas);
    
    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        totalCambios: parseInt(estadisticas.TotalCambios) || 0,
        promedioSueldo: parseFloat(estadisticas.PromedioSueldo) || 0,
        sueldoMinimo: parseFloat(estadisticas.SueldoMinimo) || 0,
        sueldoMaximo: parseFloat(estadisticas.SueldoMaximo) || 0,
        primeraFecha: estadisticas.PrimeraFecha,
        ultimaFecha: estadisticas.UltimaFecha
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Eliminar sueldo base
exports.eliminarSueldoBase = async (req, res) => {
  try {
    const { sueldoId } = req.params;
    
    console.log('🗑️ Eliminando sueldo base con ID:', sueldoId);
    
    // Verificar que el sueldo existe
    const verificarQuery = `
      SELECT SueldoID, EmpleadoDNI, MontoMensual, FechaVigencia
      FROM PRI.SueldoBase 
      WHERE SueldoID = @sueldoId
    `;
    
    const verificarResult = await executeQuery(verificarQuery, [
      { name: 'sueldoId', type: sql.Int, value: parseInt(sueldoId) }
    ]);
    
    if (verificarResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sueldo base no encontrado',
        error: 'SUELDO_NOT_FOUND'
      });
    }
    
    const sueldoEliminado = verificarResult.recordset[0];
    
    // Eliminar el sueldo base
    const deleteQuery = `
      DELETE FROM PRI.SueldoBase 
      WHERE SueldoID = @sueldoId
    `;
    
    await executeQuery(deleteQuery, [
      { name: 'sueldoId', type: sql.Int, value: parseInt(sueldoId) }
    ]);
    
    console.log('✅ Sueldo base eliminado exitosamente:', sueldoEliminado);
    
    res.json({
      success: true,
      message: 'Sueldo base eliminado exitosamente',
      data: {
        sueldoEliminado: sueldoEliminado
      }
    });
    
  } catch (error) {
    console.error('❌ Error eliminando sueldo base:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando sueldo base',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};
