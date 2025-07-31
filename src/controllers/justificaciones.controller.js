const { pool } = require('../db');
const sql = require('mssql');

// GET /justificaciones/dnis
async function listarDNIsJustificacion(req, res) {
  try {
    const result = await (await pool).request().query(`
      SELECT DNI
      FROM PRI.Empleados
      WHERE FechaCese IS NULL
      ORDER BY DNI
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al listar DNIs para justificación:', err);
    res.status(500).json({ error: 'Error al listar DNIs' });
  }
}

// GET /justificaciones/:dni
async function obtenerEmpleadoJustificacion(req, res) {
  const { dni } = req.params;
  try {
    const result = await (await pool).request()
      .input('dni', sql.VarChar(12), dni)
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno
        FROM PRI.Empleados
        WHERE DNI = @dni AND FechaCese IS NULL
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener empleado:', err);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
}

// GET /justificaciones/tipos
async function listarTiposJustificacion(req, res) {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
      SELECT DISTINCT TipoJustificacion
      FROM Partner.dbo.Justificaciones
      ORDER BY TipoJustificacion
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al listar tipos de justificación:', err);
    res.status(500).json({ error: 'Error al listar tipos' });
  }
}

// GET /justificaciones/:dni/jefe
async function obtenerJefeDirecto(req, res) {
  const { dni } = req.params;

  try {
    const conn = await pool;
    const result = await conn.request()
      .input('dni', sql.VarChar(12), dni)
      .query(`
        SELECT
          SupervisorDNI,
          CoordinadorDNI,
          JefeDNI
        FROM PRI.Empleados
        WHERE DNI = @dni
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const { SupervisorDNI, CoordinadorDNI, JefeDNI } = result.recordset[0];

    const jefeDirecto = SupervisorDNI || CoordinadorDNI || JefeDNI;

    if (!jefeDirecto) {
      return res.status(404).json({ error: 'No se encontró jefe directo' });
    }

    res.json({ jefeDNI: jefeDirecto });

  } catch (err) {
    console.error('Error al obtener jefe directo:', err);
    res.status(500).json({ error: 'Error al obtener jefe directo' });
  }
}

// POST /justificaciones
async function registrarJustificacion(req, res) {
  const { EmpleadoDNI, Fecha, TipoJustificacion, Motivo, Estado, AprobadorDNI } = req.body;

  try {
    const conn = await pool;
    await conn.request()
      .input('EmpleadoDNI', sql.VarChar(12), EmpleadoDNI)
      .input('Fecha', sql.Date, Fecha)
      .input('TipoJustificacion', sql.VarChar(100), TipoJustificacion)
      .input('Motivo', sql.VarChar(200), Motivo)
      .input('Estado', sql.VarChar(20), Estado)
      .input('AprobadorDNI', sql.VarChar(12), AprobadorDNI)
      .query(`
        INSERT INTO Partner.dbo.Justificaciones (
          EmpleadoDNI, Fecha, TipoJustificacion, Motivo, Estado, AprobadorDNI
        ) VALUES (
          @EmpleadoDNI, @Fecha, @TipoJustificacion, @Motivo, @Estado, @AprobadorDNI
        )
      `);

    res.status(201).json({ mensaje: 'Justificación registrada correctamente' });

  } catch (err) {
    console.error('Error al registrar justificación:', err);
    res.status(500).json({ error: 'Error al registrar justificación' });
  }
}

// GET /justificaciones/:dni - Obtener justificaciones de un empleado
async function obtenerJustificacionesEmpleado(req, res) {
  const { dni } = req.params;
  
  try {
    const conn = await pool;
    const result = await conn.request()
      .input('DNI', sql.VarChar(12), dni)
      .query(`
        SELECT JustificacionID, EmpleadoDNI, Fecha, TipoJustificacion, 
               Motivo, Estado, AprobadorDNI
        FROM Partner.dbo.Justificaciones
        WHERE EmpleadoDNI = @DNI
        ORDER BY Fecha DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener justificaciones:', err);
    res.status(500).json({ error: 'Error al obtener justificaciones' });
  }
}

// DELETE /justificaciones/:id - Eliminar justificación
async function eliminarJustificacion(req, res) {
  const { id } = req.params;
  
  try {
    const conn = await pool;
    const result = await conn.request()
      .input('JustificacionID', sql.Int, id)
      .query(`
        DELETE FROM Partner.dbo.Justificaciones
        WHERE JustificacionID = @JustificacionID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Justificación no encontrada' });
    }

    res.json({ mensaje: 'Justificación eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar justificación:', err);
    res.status(500).json({ error: 'Error al eliminar justificación' });
  }
}

module.exports = {
  listarDNIsJustificacion,
  obtenerEmpleadoJustificacion,
  listarTiposJustificacion,
  obtenerJefeDirecto,
  registrarJustificacion,
  obtenerJustificacionesEmpleado,
  eliminarJustificacion
};
