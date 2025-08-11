const sql = require('mssql');
require('dotenv').config();

// Configuración de la base de datos - USANDO LA MISMA CONFIGURACIÓN DEL PROYECTO ACTUAL
const dbConfig = {
  server: process.env.DB_HOST || '127.0.0.1',        // Mismo host del proyecto actual
  database: process.env.DB_NAME || 'Partner',         // Misma base de datos (Partner)
  user: process.env.DB_USER || 'tu_usuario',          // Mismo usuario del .env
  password: process.env.DB_PASS || 'tu_password',     // Misma contraseña del .env
  port: parseInt(process.env.DB_PORT || '1433'),      // Mismo puerto (1433)
  options: {
    encrypt: false,                                    // Misma configuración
    trustServerCertificate: true,                      // Misma configuración
    enableArithAbort: true,
    requestTimeout: 30000,                             // 30 segundos
    connectionTimeout: 30000
  },
  pool: {
    max: 10,                                           // Mismo pool del proyecto actual
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000
  }
};

// Pool de conexiones
let pool = null;

// Función para obtener conexión
async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('✅ Conexión a base de datos establecida (Backend Refactorizado)');
      console.log(`   Base de datos: ${dbConfig.database}`);
      console.log(`   Servidor: ${dbConfig.server}:${dbConfig.port}`);
    }
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
}

// Función para cerrar conexión
async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Conexión a base de datos cerrada');
    }
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
  }
}

// Función para ejecutar consultas
async function executeQuery(query, params = []) {
  const connection = await getConnection();
  try {
    const request = connection.request();
    
    // Agregar parámetros si existen
    if (params && params.length > 0) {
      params.forEach((param) => {
        request.input(param.name, param.type, param.value);
      });
    }
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('❌ Error ejecutando consulta:', error);
    throw error;
  }
}

// Función para ejecutar stored procedures
async function executeStoredProcedure(procedureName, params = []) {
  const connection = await getConnection();
  try {
    const request = connection.request();
    
    // Agregar parámetros si existen
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        request.input(param.name, param.type, param.value);
      });
    }
    
    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error('❌ Error ejecutando stored procedure:', error);
    throw error;
  }
}

module.exports = {
  getConnection,
  closeConnection,
  executeQuery,
  executeStoredProcedure,
  sql
};
