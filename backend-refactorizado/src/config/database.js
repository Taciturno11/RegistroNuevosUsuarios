const sql = require('mssql');
require('dotenv').config();

// Configuración de la base de datos - Variables de entorno obligatorias
const dbConfig = {
  server: process.env.SQL_SERVER,        // IP del servidor de BD
  database: process.env.SQL_DATABASE,    // Nombre de la BD
  user: process.env.SQL_USER,            // Usuario de BD
  password: process.env.SQL_PASSWORD,    // Password de BD
  port: parseInt(process.env.SQL_PORT),  // Puerto de BD
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
  sql,
  pool
};
