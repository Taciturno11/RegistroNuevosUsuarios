const { pool, sql } = require('../db');

// Devuelve varios catálogos en una sola llamada
exports.listarCatalogos = async (_, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
      SELECT 'jornadas'      AS tipo, JornadaID      AS id, NombreJornada      AS nombre FROM PRI.Jornada
      UNION ALL
      SELECT 'campanias',     CampañaID       , NombreCampaña       FROM PRI.Campanias
      UNION ALL
      SELECT 'cargos',        CargoID         , NombreCargo         FROM PRI.Cargos
      UNION ALL
      SELECT 'modalidades',   ModalidadID     , NombreModalidad     FROM PRI.ModalidadesTrabajo
    `);

    // Agrupa por tipo
    const data = result.recordset.reduce((acc, row) => {
      (acc[row.tipo] = acc[row.tipo] || []).push({ id: row.id, nombre: row.nombre });
      return acc;
    }, {});
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener catálogos' });
  }
};

// Grupos de horario filtrados por jornada
exports.listarGruposHorario = async (req, res) => {
  const { jornada } = req.query;
  if (!jornada) return res.status(400).json({ error: 'Parámetro jornada requerido' });

  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input('jornada', sql.Int, jornada)
      .query(`
        SELECT GrupoID AS id, NombreHorario AS nombre
        FROM dbo.GruposDeHorario
        WHERE JornadaID = @jornada
        ORDER BY nombre
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener grupos de horario' });
  }
};
