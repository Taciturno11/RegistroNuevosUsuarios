const { executeQuery, sql } = require('../config/database');

// ========================================
// GESTIÓN DE GRUPOS DE HORARIO
// ========================================

// GET /grupos - Listar solo los 32 nombres base (sin descansos)
exports.listarBases = async (req, res) => {
  try {
    console.log('👥 Obteniendo nombres base de grupos de horario');
    
    const query = `
      SELECT DISTINCT
        /* Si contiene "(Desc." corta ahí, si no, usa todo el nombre */
        LEFT(NombreGrupo,
          CASE WHEN CHARINDEX(' (Desc.', NombreGrupo) > 0
               THEN CHARINDEX(' (Desc.', NombreGrupo) - 1
               ELSE LEN(NombreGrupo)
          END) AS NombreBase
      FROM dbo.GruposDeHorario
      ORDER BY NombreBase`;
    
    const result = await executeQuery(query);
    
    console.log(`✅ ${result.recordset.length} nombres base de grupos obtenidos`);
    
    res.json({
      success: true,
      message: 'Nombres base de grupos obtenidos exitosamente',
      data: result.recordset,
      total: result.recordset.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo nombres base de grupos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// GET /grupos/:base - Listar las 7 variantes de descanso de un grupo específico
exports.listarDescansos = async (req, res) => {
  try {
    const { base } = req.params;
    
    if (!base) {
      return res.status(400).json({
        success: false,
        message: 'Nombre base del grupo es requerido',
        error: 'MISSING_BASE_PARAM'
      });
    }
    
    console.log(`👥 Obteniendo descansos para grupo base: ${base}`);
    
    const query = `
      SELECT GrupoID, NombreGrupo
      FROM dbo.GruposDeHorario
      WHERE NombreGrupo LIKE @base + ' (Desc.%'
      ORDER BY NombreGrupo`;
    
    const result = await executeQuery(query, [
      { name: 'base', type: sql.VarChar, value: base }
    ]);
    
    console.log(`✅ ${result.recordset.length} variantes de descanso encontradas para: ${base}`);
    
    res.json({
      success: true,
      message: `Variantes de descanso obtenidas para: ${base}`,
      data: {
        grupoBase: base,
        variantes: result.recordset,
        total: result.recordset.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo variantes de descanso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// GET /grupos/horas - Listar grupos base + rango horario (entrada/salida)
exports.listarBasesConHoras = async (req, res) => {
  try {
    console.log('👥 Obteniendo grupos base con rango horario');
    
    const query = `
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
             CONVERT(char(5), MAX(h.HoraSalida), 108) AS HoraFin
      FROM bases b
      JOIN dbo.Horarios_Base h
           ON h.NombreHorario = b.NombreBase
      GROUP BY b.NombreBase
      ORDER BY b.NombreBase`;
    
    const result = await executeQuery(query);
    
    console.log(`✅ ${result.recordset.length} grupos con horarios obtenidos`);
    
    res.json({
      success: true,
      message: 'Grupos base con horarios obtenidos exitosamente',
      data: result.recordset,
      total: result.recordset.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo grupos con horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// GET /grupos/info - Obtener información general del sistema de grupos
exports.getInfoGrupos = async (req, res) => {
  try {
    console.log('ℹ️ Obteniendo información general del sistema de grupos');
    
    // Obtener estadísticas básicas
    const statsQuery = `
      SELECT 
        COUNT(*) as totalGrupos,
        COUNT(DISTINCT LEFT(NombreGrupo, 
          CASE WHEN CHARINDEX(' (Desc.', NombreGrupo) > 0
               THEN CHARINDEX(' (Desc.', NombreGrupo) - 1
               ELSE LEN(NombreGrupo)
          END)) as gruposBase,
        COUNT(CASE WHEN NombreGrupo LIKE '%(Desc.%' THEN 1 END) as variantesDescanso
      FROM dbo.GruposDeHorario`;
    
    const statsResult = await executeQuery(statsQuery);
    const stats = statsResult.recordset[0];
    
    res.json({
      success: true,
      message: 'Información del sistema de grupos obtenida',
      data: {
        estadisticas: {
          totalGrupos: stats.totalGrupos,
          gruposBase: stats.gruposBase,
          variantesDescanso: stats.variantesDescanso
        },
        descripcion: 'Sistema de grupos de horario con variantes de descanso',
        fechaConsulta: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo información de grupos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
