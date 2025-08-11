const { getConnection, executeQuery } = require('../config/database');

// Controlador de prueba para verificar conexión a base de datos
exports.testConnection = async (req, res) => {
  try {
    console.log('🧪 Probando conexión a base de datos...');
    
    // Obtener conexión
    const connection = await getConnection();
    console.log('✅ Conexión obtenida exitosamente');
    
    // Ejecutar consulta simple
    const result = await executeQuery('SELECT 1 as test, GETDATE() as fecha_actual');
    console.log('✅ Consulta de prueba ejecutada exitosamente');
    
    res.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        connection: 'OK',
        query_result: result.recordset[0],
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de conexión:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba de conexión',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Controlador para probar consulta a tabla de empleados
exports.testEmpleadosTable = async (req, res) => {
  try {
    console.log('🧪 Probando consulta a tabla de empleados...');
    
    // Consulta simple a la tabla de empleados
    const result = await executeQuery('SELECT TOP 1 DNI, Nombres, ApellidoPaterno FROM PRI.Empleados');
    console.log('✅ Consulta a empleados ejecutada exitosamente');
    
    res.json({
      success: true,
      message: 'Consulta a tabla empleados exitosa',
      data: {
        empleado_ejemplo: result.recordset[0] || 'No hay empleados en la tabla',
        total_registros: result.recordset.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error consultando tabla empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error consultando tabla empleados',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Controlador para obtener información de la base de datos
exports.getDatabaseInfo = async (req, res) => {
  try {
    console.log('🧪 Obteniendo información de la base de datos...');
    
    // Obtener información de la base de datos
    const result = await executeQuery(`
      SELECT 
        DB_NAME() as database_name,
        @@VERSION as sql_server_version,
        GETDATE() as current_time
    `);
    
    console.log('✅ Información de BD obtenida exitosamente');
    
    res.json({
      success: true,
      message: 'Información de base de datos obtenida',
      data: result.recordset[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo información de BD:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información de BD',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
