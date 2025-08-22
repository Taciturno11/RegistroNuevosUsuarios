const { executeQuery, sql } = require('../config/database');
const { parseFechaLocal } = require('../utils/dateUtils');

// Obtener bonos de un empleado
exports.getBonosEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;
    
    console.log('🔍 Obteniendo bonos para empleado:', dni);
    
    const query = `
      SELECT BonoID, EmpleadoDNI, Monto, Fecha, TipoBono
      FROM PRI.BonosFijos 
      WHERE EmpleadoDNI = @dni
      ORDER BY Fecha DESC
    `;
    
    const result = await executeQuery(query, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);
    
    console.log(`✅ Bonos encontrados: ${result.recordset.length}`);
    
    res.json({
      success: true,
      message: 'Bonos obtenidos exitosamente',
      data: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo bonos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo bonos',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Registrar nuevo bono
exports.registrarBono = async (req, res) => {
  try {
    const { EmpleadoDNI, Monto, Fecha, TipoBono } = req.body;
    
    console.log('💰 Registrando nuevo bono:', {
      EmpleadoDNI,
      Monto,
      Fecha,
      TipoBono
    });
    
    // Validaciones
    if (!EmpleadoDNI || !Monto || !Fecha || !TipoBono) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        error: 'MISSING_FIELDS'
      });
    }
    
    if (parseFloat(Monto) <= 0) {
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
    
    // La tabla PRI.BonosFijos ya existe según el usuario
    
    // Insertar el bono
    const insertQuery = `
      INSERT INTO PRI.BonosFijos (EmpleadoDNI, Monto, Fecha, TipoBono)
      VALUES (@dni, @monto, @fecha, @tipoBono)
    `;
    
    // Usar parseFechaLocal para evitar problemas de zona horaria (como en justificaciones)
    const fechaBono = parseFechaLocal(Fecha) || new Date(Fecha);
    
    await executeQuery(insertQuery, [
      { name: 'dni', type: sql.VarChar, value: EmpleadoDNI },
      { name: 'monto', type: sql.Decimal(10, 2), value: parseFloat(Monto) },
      { name: 'fecha', type: sql.Date, value: fechaBono },
      { name: 'tipoBono', type: sql.VarChar, value: TipoBono }
    ]);
    
    console.log('✅ Bono registrado exitosamente');
    
    res.json({
      success: true,
      message: 'Bono registrado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error registrando bono:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando bono',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Eliminar bono
exports.eliminarBono = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Eliminando bono:', id);
    
    // Verificar que el bono existe
    const bonoQuery = `
      SELECT BonoID FROM PRI.BonosFijos WHERE BonoID = @id
    `;
    
    const bonoResult = await executeQuery(bonoQuery, [
      { name: 'id', type: sql.Int, value: parseInt(id) }
    ]);
    
    if (bonoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bono no encontrado',
        error: 'BONO_NOT_FOUND'
      });
    }
    
    // Eliminar el bono
    const deleteQuery = `
      DELETE FROM PRI.BonosFijos WHERE BonoID = @id
    `;
    
    await executeQuery(deleteQuery, [
      { name: 'id', type: sql.Int, value: parseInt(id) }
    ]);
    
    console.log('✅ Bono eliminado exitosamente');
    
    res.json({
      success: true,
      message: 'Bono eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando bono:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando bono',
      error: 'INTERNAL_SERVER_ERROR',
      details: error.message
    });
  }
};

// Obtener estadísticas de bonos de un empleado
exports.getEstadisticasBonos = async (req, res) => {
  try {
    const { dni } = req.params;
    
    console.log('📊 Obteniendo estadísticas de bonos para empleado:', dni);
    
    const query = `
      SELECT 
        COUNT(*) as TotalBonos,
        AVG(Monto) as PromedioBono,
        SUM(CASE 
          WHEN MONTH(Fecha) = MONTH(GETDATE()) AND YEAR(Fecha) = YEAR(GETDATE()) 
          THEN 1 ELSE 0 
        END) as BonosEsteMes,
        SUM(CASE 
          WHEN MONTH(Fecha) = MONTH(GETDATE()) AND YEAR(Fecha) = YEAR(GETDATE()) 
          THEN Monto ELSE 0 
        END) as TotalEsteMes
      FROM PRI.BonosFijos 
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
        totalBonos: parseInt(estadisticas.TotalBonos) || 0,
        promedioBono: parseFloat(estadisticas.PromedioBono) || 0,
        bonosEsteMes: parseInt(estadisticas.BonosEsteMes) || 0,
        totalEsteMes: parseFloat(estadisticas.TotalEsteMes) || 0
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
