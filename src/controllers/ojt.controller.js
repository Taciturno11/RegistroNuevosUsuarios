// src/controllers/ojt.controller.js
const { pool } = require('../db');
const sql      = require('mssql');

/* =============================================================
   FECHAS
   - El front envía/recibe texto "yyyy-MM-dd HH:mm:ss"
   - Enviar así evita la conversión (UTC → -05) del driver.
   - En SQL convertimos con estilo 120 (yyyy-mm-dd hh:mi:ss)
   =============================================================*/

/* 0. Lista de DNIs de empleados activos */
async function listarDNIsOJT(req, res) {
  try {
    const result = await (await pool).request().query(`
      SELECT DNI
      FROM PRI.Empleados
      WHERE FechaCese IS NULL
      ORDER BY DNI
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al listar DNIs OJT:', err);
    res.status(500).json({ error: 'Error al listar DNIs' });
  }
}



/* ═════ 1) HISTORIAL POR DNI ═══════════════════════════════ */
async function listarHistorial (req, res) {
  const { dni } = req.params;
  try {
    const rows = (await (await pool).request()
      .input('dni', sql.VarChar(12), dni)
      .query(`
        SELECT  UsoCICID,
                NombreUsuarioCIC,
                DNIEmpleado,
                CONVERT(varchar(19), FechaHoraInicio,120) AS FechaHoraInicio,
                CONVERT(varchar(19), FechaHoraFin   ,120) AS FechaHoraFin,
                Observaciones
        FROM    PRI.UsoUsuarioCIC
        WHERE   DNIEmpleado = @dni
        ORDER   BY FechaHoraInicio DESC
      `)).recordset;

    res.json(rows);                   // ← fechas ya son strings planas
  } catch (err) {
    console.error('❌ Error listar historial OJT:', err);
    res.status(500).json({ error: 'Error al listar historial' });
  }
}

/* ═════ 2) NUEVO REGISTRO ══════════════════════════════════ */
async function crearOJT (req, res) {
  const {
    UsuarioCIC, DNIEmpleado,
    FechaHoraInicio,          // string "2025-06-28 01:00:00"
    FechaHoraFin = null,
    Observaciones = null
  } = req.body;

  try {
    await (await pool).request()
      .input('UsuarioCIC',      sql.VarChar(50),  UsuarioCIC)
      .input('DNIEmpleado',     sql.VarChar(12),  DNIEmpleado)
      .input('FechaHoraInicio', sql.VarChar(19),  FechaHoraInicio)
      .input('FechaHoraFin',    sql.VarChar(19),  FechaHoraFin)
      .input('Observaciones',   sql.VarChar(200), Observaciones)
      .query(`
        INSERT INTO PRI.UsoUsuarioCIC
              (NombreUsuarioCIC , DNIEmpleado , FechaHoraInicio ,
               FechaHoraFin     , Observaciones)
        VALUES(@UsuarioCIC      , @DNIEmpleado,
               CONVERT(datetime,@FechaHoraInicio,120),
               CASE
                 WHEN @FechaHoraFin IS NULL OR @FechaHoraFin = ''
                 THEN NULL
                 ELSE CONVERT(datetime,@FechaHoraFin,120)
               END,
               @Observaciones)
      `);

    res.status(201).json({ mensaje: 'Registro OJT creado' });
  } catch (err) {
    console.error('❌ Error crear OJT:', err);
    res.status(500).json({ error: 'Error al crear OJT' });
  }
}

/* ═════ 3) ACTUALIZAR REGISTRO ═════════════════════════════ */
async function actualizarOJT (req, res) {
  const { id } = req.params;
  const {
    UsuarioCIC,
    FechaHoraInicio,
    FechaHoraFin,
    Observaciones
  } = req.body;

  try {
    await (await pool).request()
      .input('id',              sql.Int,         id)
      .input('UsuarioCIC',      sql.VarChar(50), UsuarioCIC)
      .input('FechaHoraInicio', sql.VarChar(19), FechaHoraInicio)
      .input('FechaHoraFin',    sql.VarChar(19), FechaHoraFin)
      .input('Observaciones',   sql.VarChar(200),Observaciones)
      .query(`
        UPDATE PRI.UsoUsuarioCIC
        SET  NombreUsuarioCIC = @UsuarioCIC,
             FechaHoraInicio  = CONVERT(datetime,@FechaHoraInicio,120),
             FechaHoraFin     = CASE
                                  WHEN @FechaHoraFin IS NULL OR @FechaHoraFin = ''
                                  THEN NULL
                                  ELSE CONVERT(datetime,@FechaHoraFin,120)
                                END,
             Observaciones    = @Observaciones
        WHERE UsoCICID = @id
      `);

    res.json({ mensaje: 'Registro OJT actualizado' });
  } catch (err) {
    console.error('❌ Error actualizar OJT:', err);
    res.status(500).json({ error: 'Error al actualizar OJT' });
  }
}

/* ──────── EXPORTS ──────── */
module.exports = {
  listarDNIsOJT,
  listarHistorial,
  crearOJT,
  actualizarOJT,
};
