const { pool, sql } = require('../db');

/*  GET /grupos
    Devuelve SOLO los 32 nombres base */
// src/controllers/grupos.controller.js
exports.listarBases = async (_, res) => {
  const sql = `
    SELECT DISTINCT
           /* Si contiene "(Desc." corta ahí, si no, usa todo el nombre */
           LEFT(NombreGrupo,
                CASE WHEN CHARINDEX(' (Desc.', NombreGrupo) > 0
                     THEN CHARINDEX(' (Desc.', NombreGrupo) - 1
                     ELSE LEN(NombreGrupo)
                END) AS NombreBase
    FROM dbo.GruposDeHorario
    ORDER BY NombreBase`;
  const { recordset } = await pool.then(c => c.request().query(sql));
  res.json(recordset);                // [{ NombreBase: 'Full Time Mañana1' }, ...]
};


/*  GET /grupos/:base
    Devuelve las 7 variantes de esa base */
exports.listarDescansos = async (req, res) => {
  const { base } = req.params;
  const query = `
    SELECT GrupoID, NombreGrupo
    FROM dbo.GruposDeHorario
    WHERE NombreGrupo LIKE @base + ' (Desc.%'
    ORDER BY NombreGrupo`;
  const { recordset } = await pool.then(c =>
    c.request().input('base', sql.VarChar, base).query(query));
  res.json(recordset);               // [{ GrupoID: 42, NombreGrupo: 'Full Time Mañana1 (Desc. Lun)' }, ...]
};

// ——— NUEVO: /grupos/horas ——————————————————————————
exports.listarBasesConHoras = async (_, res) => {
  const sql = `
    WITH bases AS (
      SELECT DISTINCT
             /* Si existe "(Desc.", corta ahí; si no, usa toda la cadena */
             SUBSTRING(
               g.NombreGrupo, 1,
               CASE
                 WHEN CHARINDEX(' (Desc.', g.NombreGrupo) > 0
                 THEN CHARINDEX(' (Desc.', g.NombreGrupo) - 1
                 ELSE LEN(g.NombreGrupo)
               END
             ) AS NombreBase
      FROM dbo.GruposDeHorario g
    )
    SELECT b.NombreBase,
           CONVERT(char(5), MIN(h.HoraEntrada), 108) AS HoraIni,
           CONVERT(char(5), MAX(h.HoraSalida ), 108) AS HoraFin
    FROM bases b
    JOIN dbo.Horarios_Base h
         ON h.NombreHorario = b.NombreBase
    GROUP BY b.NombreBase
    ORDER BY b.NombreBase;`;

  try {
    const conn = await pool;
    const { recordset } = await conn.request().query(sql);
    res.json(recordset);                     // [{ NombreBase, HoraIni, HoraFin }, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo obtener horas' });
  }
};
