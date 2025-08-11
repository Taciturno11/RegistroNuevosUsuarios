const { pool } = require('../db'); // ← importa la promesa pool
const sql      = require('mssql'); // tipos (VarChar, Date, etc.)

// 1. Listar DNIs activos
async function listarDNIsActivos(req, res) {
  try {
    const conn = await pool;                             // ✅
    const result = await conn
      .request()
      .query(`SELECT DNI
              FROM PRI.Empleados
              WHERE FechaCese IS NULL
              ORDER BY DNI`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar DNIs activos' });
  }
}

// 2. Obtener empleado por DNI
async function obtenerPorDNI(req, res) {
  const { dni } = req.params;
  try {
    const conn = await pool;                             // ✅
    const result = await conn
      .request()
      .input('dni', sql.VarChar(12), dni)
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno,
               FechaContratacion, FechaCese, EstadoEmpleado
        FROM PRI.Empleados
        WHERE DNI = @dni
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('ERROR obtenerPorDNI:', err);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
}

// 3. Registrar cese
async function registrarCese(req, res) {
  const { dni } = req.params;
  const { fechaCese } = req.body;
  try {
    const conn = await pool;                             // ✅
    await conn
      .request()
      .input('dni', sql.VarChar(12), dni)
      .input('fechaCese', sql.Date, fechaCese)
      .query(`
        UPDATE PRI.Empleados
        SET FechaCese = @fechaCese,
            EstadoEmpleado = 'Cese'
        WHERE DNI = @dni
      `);
    res.json({ mensaje: 'Cese registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar cese' });
  }
}

// 4. Anular cese
async function anularCese(req, res) {
  const { dni } = req.params;
  try {
    const conn = await pool;                             // ✅
    await conn
      .request()
      .input('dni', sql.VarChar(12), dni)
      .query(`
        UPDATE PRI.Empleados
        SET FechaCese = NULL,
            EstadoEmpleado = 'Activo'
        WHERE DNI = @dni
      `);
    res.json({ mensaje: 'Cese anulado correctamente' });
  } catch (err) {
    console.error('ERROR anularCese:', err);
    res.status(500).json({ error: 'Error al anular cese' });
  }
}

module.exports = {
  listarDNIsActivos,
  obtenerPorDNI,
  registrarCese,
  anularCese
};
