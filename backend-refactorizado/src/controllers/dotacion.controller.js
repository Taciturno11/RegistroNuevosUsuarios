const { executeQuery, sql } = require('../config/database');

// ========================================
// DOTACIÓN - CONTROLADOR (SOLO AGENTES)
// ========================================

// Obtener datos de dotación por campaña y jornada (solo agentes - CargoID=1)
exports.getDotacion = async (req, res) => {
  try {
    console.log('📊 Obteniendo datos de dotación (solo agentes)...');

    // Obtener campañas específicas
    const campaniasQuery = `
      SELECT CampañaID, NombreCampaña 
      FROM PRI.Campanias 
      WHERE CampañaID IN (1, 15, 24, 19, 2, 4, 14)
      ORDER BY 
        CASE CampañaID 
          WHEN 1 THEN 1
          WHEN 15 THEN 2
          WHEN 24 THEN 3
          WHEN 19 THEN 4
          WHEN 2 THEN 5
          WHEN 4 THEN 6
          WHEN 14 THEN 7
        END
    `;

    const campaniasResult = await executeQuery(campaniasQuery);
    const campanias = campaniasResult.recordset;

    // Obtener jornadas
    const jornadasQuery = `
      SELECT JornadaID, NombreJornada 
      FROM PRI.Jornada 
      WHERE JornadaID IN (1, 2, 3)
      ORDER BY JornadaID
    `;

    const jornadasResult = await executeQuery(jornadasQuery);
    const jornadas = jornadasResult.recordset;

    // Obtener dotación actual por campaña y jornada (solo agentes)
    const dotacionQuery = `
      SELECT 
        e.CampañaID,
        c.NombreCampaña,
        e.JornadaID,
        j.NombreJornada,
        COUNT(*) as Cantidad
      FROM PRI.Empleados e
      INNER JOIN PRI.Campanias c ON e.CampañaID = c.CampañaID
      INNER JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      WHERE e.EstadoEmpleado = 'Activo'
        AND e.CargoID = 1
        AND e.CampañaID IN (1, 15, 24, 19, 2, 4, 14)
        AND e.JornadaID IN (1, 2, 3)
      GROUP BY e.CampañaID, c.NombreCampaña, e.JornadaID, j.NombreJornada
      ORDER BY 
        CASE e.CampañaID 
          WHEN 1 THEN 1
          WHEN 15 THEN 2
          WHEN 24 THEN 3
          WHEN 19 THEN 4
          WHEN 2 THEN 5
          WHEN 4 THEN 6
          WHEN 14 THEN 7
        END,
        e.JornadaID
    `;

    const dotacionResult = await executeQuery(dotacionQuery);
    const dotacionData = dotacionResult.recordset;

    // Obtener metas guardadas (si existen)
    const metasQuery = `
      SELECT CampañaID, Meta
      FROM dbo.DotacionMetas
    `;

    let metasData = [];
    try {
      const metasResult = await executeQuery(metasQuery);
      metasData = metasResult.recordset;
      console.log('📊 Metas cargadas desde BD:', metasData);
    } catch (error) {
      console.log('⚠️ Tabla de metas no existe aún, continuando sin metas');
    }

    // Estructurar datos para el frontend
    const datosEstructurados = campanias.map(campania => {
      const fila = {
        campania: {
          id: campania.CampañaID,
          nombre: campania.NombreCampaña
        },
        jornadas: {},
        dotaActual: 0,
        meta: 0,
        cumplimiento: 0
      };

      // Llenar datos por jornada
      jornadas.forEach(jornada => {
        const dotacionItem = dotacionData.find(
          item => item.CampañaID === campania.CampañaID && item.JornadaID === jornada.JornadaID
        );
        
        const cantidad = dotacionItem ? dotacionItem.Cantidad : 0;
        fila.jornadas[jornada.JornadaID] = {
          id: jornada.JornadaID,
          nombre: jornada.NombreJornada,
          cantidad: cantidad
        };
        
        fila.dotaActual += cantidad;
      });

      // Buscar meta guardada
      const metaItem = metasData.find(
        item => item.CampañaID === campania.CampañaID
      );
      
      if (metaItem) {
        fila.meta = metaItem.Meta;
        fila.cumplimiento = fila.meta > 0 ? ((fila.dotaActual / fila.meta) * 100).toFixed(2) : 0;
        console.log(`📊 Meta asignada para ${campania.NombreCampaña}: ${fila.meta}, Cumplimiento: ${fila.cumplimiento}%`);
      } else {
        console.log(`⚠️ No se encontró meta para ${campania.NombreCampaña} (ID: ${campania.CampañaID})`);
      }

      return fila;
    });

    res.json({
      success: true,
      message: 'Datos de dotación obtenidos exitosamente',
      data: {
        campanias: campanias,
        jornadas: jornadas,
        dotacion: datosEstructurados
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo dotación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Guardar meta de dotación
exports.guardarMeta = async (req, res) => {
  try {
    const { campaniaId, meta } = req.body;

    if (!campaniaId || meta === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campaña ID y meta son requeridos',
        error: 'MISSING_PARAMETERS'
      });
    }

    // Crear tabla de metas si no existe
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DotacionMetas' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE [dbo].[DotacionMetas] (
          [ID] [int] IDENTITY(1,1) NOT NULL,
          [CampañaID] [int] NOT NULL,
          [Meta] [int] NOT NULL,
          [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
          [FechaModificacion] [datetime] NOT NULL DEFAULT GETDATE(),
          CONSTRAINT [PK_DotacionMetas] PRIMARY KEY CLUSTERED ([ID] ASC),
          CONSTRAINT [IX_DotacionMetas_CampañaID] UNIQUE ([CampañaID])
        )
      END
    `;

    await executeQuery(createTableQuery);

    // Insertar o actualizar meta
    const upsertQuery = `
      MERGE dbo.DotacionMetas AS target
      USING (SELECT @CampañaID as CampañaID, @Meta as Meta) AS source
      ON target.CampañaID = source.CampañaID
      WHEN MATCHED THEN
        UPDATE SET Meta = source.Meta, FechaModificacion = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (CampañaID, Meta) VALUES (source.CampañaID, source.Meta);
    `;

    await executeQuery(upsertQuery, [
      { name: 'CampañaID', type: sql.Int, value: parseInt(campaniaId) },
      { name: 'Meta', type: sql.Int, value: parseInt(meta) }
    ]);

    res.json({
      success: true,
      message: 'Meta guardada exitosamente',
      data: { campaniaId, meta }
    });

  } catch (error) {
    console.error('❌ Error guardando meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener resumen de dotación (solo agentes)
exports.getResumenDotacion = async (req, res) => {
  try {
    const resumenQuery = `
      SELECT 
        COUNT(CASE WHEN EstadoEmpleado = 'Activo' THEN 1 END) as TotalEmpleados,
        COUNT(CASE WHEN EstadoEmpleado = 'Activo' AND CampañaID IN (1, 15, 24, 19, 2, 4, 14) THEN 1 END) as EmpleadosActivos,
        COUNT(CASE WHEN EstadoEmpleado = 'Cese' AND CampañaID IN (1, 15, 24, 19, 2, 4, 14) THEN 1 END) as EmpleadosCesados
      FROM PRI.Empleados
      WHERE CargoID = 1
    `;

    const resumenResult = await executeQuery(resumenQuery);
    const resumen = resumenResult.recordset[0];

    res.json({
      success: true,
      message: 'Resumen de dotación obtenido exitosamente',
      data: resumen
    });

  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
