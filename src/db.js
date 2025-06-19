require('dotenv').config();
const sql = require('mssql');

// Lee variables del .env
const dbSettings = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,   // Partner
  server:   process.env.DB_HOST,   // Ej: 127.0.0.1
  port:     parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: false,       // true si usas SSL
    trustServerCertificate: true
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const pool = new sql.ConnectionPool(dbSettings)
  .connect()
  .then(conn => {
    console.log('✅ Conexión SQL Server OK');
    return conn;
  })
  .catch(err => console.error('❌ Error de conexión:', err));

module.exports = { sql, pool };
