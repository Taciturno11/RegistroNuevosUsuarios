const sql = require('mssql');
const { getConnection } = require('../config/database');

// Duración de campañas (idéntico al original)
const DURACION = {
  "Unificado"         : { cap: 14, ojt: 5 },
  "Renovacion"        : { cap: 5 , ojt: 5 },
  "Ventas Hogar INB"  : { cap: 5 , ojt: 5 },
  "Ventas Hogar OUT"  : { cap: 5 , ojt: 5 },
  "Ventas Movil INB"  : { cap: 5 , ojt: 5 },
  "Portabilidad POST" : { cap: 5 , ojt: 5 },
  "Migracion"         : { cap: 3 , ojt: 5 },
  "Portabilidad PPA"  : { cap: 5 , ojt: 5 },
  "Crosselling"       : { cap: 8 , ojt: 5 }
};

// Función para normalizar nombres de campaña
function normalizarCampania(nombre) {
  if (!nombre) return nombre;
  
  let normalizado = nombre.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const variaciones = {
    'unificado': 'Unificado',
    'renovacion': 'Renovacion',
    'renovación': 'Renovacion',
    'ventas hogar inb': 'Ventas Hogar INB',
    'ventas hogar out': 'Ventas Hogar OUT',
    'ventas movil inb': 'Ventas Movil INB',
    'ventas móvil inb': 'Ventas Movil INB',
    'portabilidad post': 'Portabilidad POST',
    'portabilidad ppa': 'Portabilidad PPA',
    'migracion': 'Migracion',
    'migración': 'Migracion',
    'crosselling': 'Crosselling'
  };
  
  if (variaciones[normalizado]) {
    return variaciones[normalizado];
  }
  
  return nombre;
}

// Función para obtener duración de campaña
function obtenerDuracion(campania) {
  if (!campania) return { cap: 5, ojt: 5 };
  
  if (DURACION[campania]) {
    return DURACION[campania];
  }
  
  const campaniaNormalizada = normalizarCampania(campania);
  const resultado = DURACION[campaniaNormalizada] || { cap: 5, ojt: 5 };
  
  return resultado;
}

// Obtener capas disponibles para un capacitador
const getCapas = async (req, res) => {
  try {
    const { dniCap, campania, mes } = req.query; // Obtener DNI del query como en el original
    
    if (!dniCap) {
      return res.status(400).json({ error: 'DNI del capacitador es requerido' });
    }

    let query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY MIN(pf.FechaInicio)) AS capa,
        FORMAT(MIN(pf.FechaInicio),'yyyy-MM-dd') AS fechaInicio,
        pf.CampañaID,
        c.NombreCampaña
      FROM Postulantes_En_Formacion pf
      LEFT JOIN PRI.Campanias c ON pf.CampañaID = c.CampañaID
      WHERE pf.DNI_Capacitador = @dniCap
    `;
    
    if (campania) query += ` AND pf.CampañaID = @camp`;
    if (mes) query += ` AND FORMAT(pf.FechaInicio,'yyyy-MM') = @prefijo`;
    
    query += ` GROUP BY pf.CampañaID, c.NombreCampaña, FORMAT(pf.FechaInicio,'yyyy-MM-dd') ORDER BY fechaInicio`;

    const pool = await getConnection();
    const request = pool.request()
      .input("dniCap", sql.VarChar(20), dniCap);
    
    if (campania) request.input("camp", sql.Int, Number(campania));
    if (mes) request.input("prefijo", sql.VarChar(7), mes);

    const result = await request.query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Error en getCapas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener meses disponibles para un capacitador
const getMeses = async (req, res) => {
  try {
    const dniCap = req.user.dni;
    
    if (!dniCap) {
      return res.status(400).json({ error: 'DNI del capacitador es requerido' });
    }

    const pool = await getConnection();
    const request = pool.request()
      .input("dniCap", sql.VarChar(20), dniCap);

    const query = `
      SELECT DISTINCT FORMAT(FechaInicio,'yyyy-MM') AS mes
      FROM Postulantes_En_Formacion
      WHERE DNI_Capacitador = @dniCap
      ORDER BY mes DESC
    `;

    const result = await request.query(query);
    res.json(result.recordset.map(r => r.mes));
    
  } catch (error) {
    console.error('Error en getMeses:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener postulantes y asistencias
const getPostulantes = async (req, res) => {
  try {
    const dniCap = req.user.dni;
    const { campaniaID, mes, fechaInicio } = req.query;
    
    if (!dniCap || !campaniaID || !mes || !fechaInicio) {
      return res.status(400).json({ error: 'Todos los parámetros son requeridos' });
    }

    // Obtener postulantes
    const pool = await getConnection();
    const postResult = await pool.request()
      .input("dniCap", sql.VarChar(20), dniCap)
      .input("camp", sql.Int, Number(campaniaID))
      .input("prefijo", sql.VarChar(7), mes)
      .input("fechaIni", sql.VarChar(10), fechaInicio)
      .query(`
        SELECT pf.DNI AS dni,
               CONCAT(pf.Nombres,' ',pf.ApellidoPaterno,' ',pf.ApellidoMaterno) AS nombre,
               pf.Telefono AS telefono,
               pf.EstadoPostulante,
               pf.CampañaID,
               c.NombreCampaña,
               pf.ModalidadID,
               m.NombreModalidad,
               pf.JornadaID,
               j.NombreJornada,
               pf.GrupoHorarioID,
               gh.NombreGrupo
        FROM Postulantes_En_Formacion pf
        LEFT JOIN PRI.Campanias c ON pf.CampañaID = c.CampañaID
        LEFT JOIN PRI.ModalidadesTrabajo m ON pf.ModalidadID = m.ModalidadID
        LEFT JOIN PRI.Jornada j ON pf.JornadaID = j.JornadaID
        LEFT JOIN GruposDeHorario gh ON pf.GrupoHorarioID = gh.GrupoID
        WHERE pf.DNI_Capacitador = @dniCap
          AND pf.CampañaID = @camp
          AND FORMAT(pf.FechaInicio,'yyyy-MM') = @prefijo
          AND FORMAT(pf.FechaInicio,'yyyy-MM-dd') = @fechaIni
      `);

    // Obtener asistencias
    const asisResult = await pool.request()
      .input("dniCap", sql.VarChar(20), dniCap)
      .input("camp", sql.Int, Number(campaniaID))
      .input("prefijo", sql.VarChar(7), mes)
      .input("fechaIni", sql.VarChar(10), fechaInicio)
      .query(`
        SELECT a.postulante_dni,
               CONVERT(char(10), a.fecha, 23) AS fecha,
               a.estado_asistencia
        FROM Asistencia_Formacion a
        JOIN Postulantes_En_Formacion p ON p.DNI = a.postulante_dni
        WHERE p.DNI_Capacitador = @dniCap
          AND p.CampañaID = @camp
          AND a.CampañaID = @camp
          AND FORMAT(a.fecha,'yyyy-MM') = @prefijo
          AND FORMAT(p.FechaInicio,'yyyy-MM-dd') = @fechaIni
      `);

    const nombreCampania = postResult.recordset[0]?.NombreCampaña || '';
    
    res.json({
      postulantes: postResult.recordset,
      asistencias: asisResult.recordset,
      duracion: obtenerDuracion(nombreCampania)
    });
    
  } catch (error) {
    console.error('Error en getPostulantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener deserciones
const getDeserciones = async (req, res) => {
  try {
    const dniCap = req.user.dni;
    const { campaniaID, mes, capa } = req.query;
    
    if (!dniCap || !campaniaID || !mes || !capa) {
      return res.status(400).json({ 
        error: "Parámetros inválidos para deserciones", 
        params: { dniCap, campaniaID, mes, capa } 
      });
    }

    console.log('🔍 Buscando deserciones para:', { dniCap, campaniaID, mes, capa });

    const pool = await getConnection();
    const result = await pool.request()
      .input("dniCap", sql.VarChar(20), dniCap)
      .input("camp", sql.Int, Number(campaniaID))
      .input("prefijo", sql.VarChar(7), mes)
      .input("capa", sql.Int, Number(capa))
      .query(`
        SELECT d.postulante_dni,
               p.Nombres + ' ' + p.ApellidoPaterno + ' ' + p.ApellidoMaterno AS nombre,
               p.Telefono AS numero,
               FORMAT(d.fecha_desercion,'yyyy-MM-dd') AS fecha_desercion,
               d.motivo,
               d.capa_numero,
               d.CampañaID,
               c.NombreCampaña,
               d.fecha_inicio
        FROM Deserciones_Formacion d
        JOIN Postulantes_En_Formacion p ON p.DNI = d.postulante_dni
        LEFT JOIN PRI.Campanias c ON d.CampañaID = c.CampañaID
        WHERE p.DNI_Capacitador = @dniCap
          AND p.CampañaID = @camp
          AND FORMAT(p.FechaInicio,'yyyy-MM') = @prefijo
          AND d.capa_numero = @capa
        ORDER BY d.fecha_desercion
      `);

    console.log('✅ Deserciones encontradas:', result.recordset.length);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Error en getDeserciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener evaluaciones
const getEvaluaciones = async (req, res) => {
  try {
    const dniCap = req.user.dni;
    const { campania, mes, fechaInicio } = req.query;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input("dniCap", sql.VarChar(20), dniCap)
      .input("camp", sql.VarChar(100), campania)
      .input("prefijo", sql.VarChar(7), mes)
      .input("fechaInicio", sql.VarChar(10), fechaInicio)
      .query(`
        SELECT e.postulante_dni,
               CONVERT(char(10), e.fecha_evaluacion, 23) AS fecha_evaluacion,
               e.nota
        FROM Evaluaciones_Formacion e
        JOIN Postulantes_En_Formacion p ON p.DNI = e.postulante_dni
        WHERE p.DNI_Capacitador = @dniCap
          AND p.CampañaID = @camp
          AND FORMAT(p.FechaInicio,'yyyy-MM') = @prefijo
          AND FORMAT(p.FechaInicio,'yyyy-MM-dd') = @fechaInicio
        ORDER BY e.fecha_evaluacion
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error en getEvaluaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener horarios base
const getHorariosBase = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        g.GrupoID,
        g.NombreGrupo AS label,
        -- Extraer Jornada y Turno del nombre del grupo
        CASE 
          WHEN g.NombreGrupo LIKE 'Full Time%' THEN 'Full Time'
          WHEN g.NombreGrupo LIKE 'Part Time%' THEN 'Part Time'
          WHEN g.NombreGrupo LIKE 'Semi Full%' THEN 'Semi Full'
          ELSE ''
        END AS jornada,
        CASE 
          WHEN g.NombreGrupo LIKE '%Mañana%' THEN 'Mañana'
          WHEN g.NombreGrupo LIKE '%Tarde%' THEN 'Tarde'
          ELSE ''
        END AS turno,
        -- Extraer Descanso
        CASE 
          WHEN g.NombreGrupo LIKE '%(Desc. Dom)%' THEN 'Dom'
          WHEN g.NombreGrupo LIKE '%(Desc. Lun)%' THEN 'Lun'
          WHEN g.NombreGrupo LIKE '%(Desc. Mar)%' THEN 'Mar'
          WHEN g.NombreGrupo LIKE '%(Desc. Mie)%' THEN 'Mie'
          WHEN g.NombreGrupo LIKE '%(Desc. Jue)%' THEN 'Jue'
          WHEN g.NombreGrupo LIKE '%(Desc. Vie)%' THEN 'Vie'
          WHEN g.NombreGrupo LIKE '%(Desc. Sab)%' THEN 'Sab'
          ELSE ''
        END AS descanso,
        -- Rango horario
        CONVERT(char(5), h.HoraEntrada, 108) + ' - ' + CONVERT(char(5), h.HoraSalida, 108) AS rango
      FROM GruposDeHorario g
      JOIN Horarios_Base h ON h.NombreHorario = LEFT(g.NombreGrupo, CHARINDEX(' (Desc.', g.NombreGrupo)-1)
      WHERE g.NombreGrupo LIKE '%(Desc. Dom)'
      ORDER BY jornada, turno, rango
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error en getHorariosBase:', error);
    // Si hay error, devolver array vacío para evitar que falle la aplicación
    res.json([]);
  }
};

// Guardar asistencias en lote
const saveAsistencias = async (req, res) => {
  console.log('🚀 saveAsistencias INICIADO - Backend funcionando correctamente');
  
  try {
    const asistencias = req.body;
    
    console.log('🔄 saveAsistencias llamado con:', {
      bodyType: typeof req.body,
      bodyLength: Array.isArray(req.body) ? req.body.length : 'No es array',
      body: JSON.stringify(req.body, null, 2)
    });
    
    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      console.log('❌ Validación falló:', {
        isArray: Array.isArray(asistencias),
        length: asistencias?.length
      });
      return res.status(400).json({ error: 'Datos de asistencia inválidos' });
    }

    console.log('✅ Validación pasó, procesando asistencias...');
    console.log('📥 Primera asistencia:', asistencias[0]);
    console.log('📥 Total de asistencias a procesar:', asistencias.length);

    const pool = await getConnection();
    console.log('✅ Conexión a base de datos establecida');
    
    const tx = new sql.Transaction(pool);
    await tx.begin();
    console.log('✅ Transacción iniciada');
    
    try {
      for (let i = 0; i < asistencias.length; i++) {
        const asistencia = asistencias[i];
        console.log(`🔄 Procesando asistencia ${i + 1}/${asistencias.length}:`, asistencia);
        
        // Validar campos requeridos
        if (!asistencia.postulante_dni || !asistencia.fecha || !asistencia.estado_asistencia) {
          console.log('❌ Campos faltantes en asistencia:', {
            postulante_dni: !!asistencia.postulante_dni,
            fecha: !!asistencia.fecha,
            estado_asistencia: !!asistencia.estado_asistencia
          });
          throw new Error(`Campos faltantes en asistencia: ${JSON.stringify(asistencia)}`);
        }
        
        console.log('🔄 Ejecutando query para asistencia:', {
          dni: asistencia.postulante_dni,
          fecha: asistencia.fecha,
          etapa: asistencia.etapa,
          estado: asistencia.estado_asistencia,
          capa: asistencia.capa_numero,
          fechaInicio: asistencia.fecha_inicio,
          CampañaID: asistencia.CampañaID
        });
        
        await tx.request()
          .input("dni", sql.VarChar(20), asistencia.postulante_dni)
          .input("fecha", sql.Date, asistencia.fecha)
          .input("etapa", sql.VarChar(20), asistencia.etapa)
          .input("estado", sql.Char(1), asistencia.estado_asistencia)
          .input("capa", sql.Int, Number(asistencia.capa_numero))
          .input("fechaInicio", sql.Date, asistencia.fecha_inicio)
          .input("CampañaID", sql.Int, asistencia.CampañaID)
          .query(`
            MERGE Asistencia_Formacion AS T
            USING (SELECT @dni AS dni, @fecha AS fecha, @capa AS capa, @CampañaID AS CampañaID) AS S
              ON T.postulante_dni = S.dni AND T.fecha = S.fecha AND T.capa_numero = S.capa AND T.CampañaID = S.CampañaID
            WHEN MATCHED THEN
              UPDATE SET etapa = @etapa, estado_asistencia = @estado, fecha_inicio = @fechaInicio
            WHEN NOT MATCHED THEN
              INSERT (postulante_dni,fecha,etapa,estado_asistencia,capa_numero,fecha_inicio,CampañaID)
              VALUES (@dni,@fecha,@etapa,@estado,@capa,@fechaInicio,@CampañaID);
          `);
        
        console.log(`✅ Asistencia ${i + 1} procesada exitosamente`);
      }
      
      console.log('✅ Todas las asistencias procesadas, haciendo commit...');
      await tx.commit();
      console.log('✅ Transacción commitada exitosamente');
      
      res.json({ success: true, message: 'Asistencias guardadas correctamente' });
      
    } catch (error) {
      console.log('❌ Error durante el procesamiento, haciendo rollback...');
      await tx.rollback();
      console.log('✅ Rollback completado');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error en saveAsistencias:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      stack: error.stack
    });
  }
};

// Guardar deserciones en lote
const saveDeserciones = async (req, res) => {
  console.log('🚀 saveDeserciones INICIADO - Backend funcionando correctamente');
  
  try {
    const deserciones = req.body;
    
    console.log('🔄 saveDeserciones llamado con:', {
      bodyType: typeof req.body,
      bodyLength: Array.isArray(req.body) ? req.body.length : 'No es array',
      body: JSON.stringify(req.body, null, 2)
    });
    
    if (!Array.isArray(deserciones) || deserciones.length === 0) {
      console.log('❌ Validación falló:', {
        isArray: Array.isArray(deserciones),
        length: deserciones?.length
      });
      return res.status(400).json({ error: 'Datos de deserción inválidos' });
    }

    console.log('✅ Validación pasó, procesando deserciones...');
    console.log('📥 Primera deserción:', deserciones[0]);
    console.log('📥 Total de deserciones a procesar:', deserciones.length);

    const pool = await getConnection();
    console.log('✅ Conexión a base de datos establecida');
    
    const tx = new sql.Transaction(pool);
    await tx.begin();
    console.log('✅ Transacción iniciada');
    
    try {
      for (let i = 0; i < deserciones.length; i++) {
        const desercion = deserciones[i];
        console.log(`🔄 Procesando deserción ${i + 1}/${deserciones.length}:`, desercion);
        
        // Validar campos requeridos
        if (!desercion.postulante_dni || !desercion.fecha_desercion || !desercion.motivo) {
          console.log('❌ Campos faltantes en deserción:', {
            postulante_dni: !!desercion.postulante_dni,
            fecha_desercion: !!desercion.fecha_desercion,
            motivo: !!desercion.motivo
          });
          throw new Error(`Campos faltantes en deserción: ${JSON.stringify(desercion)}`);
        }
        
        console.log('🔄 Ejecutando query para deserción:', {
          dni: desercion.postulante_dni,
          fecha: desercion.fecha_desercion,
          motivo: desercion.motivo,
          capa: desercion.capa_numero,
          fechaInicio: desercion.fecha_inicio,
          CampañaID: desercion.CampañaID
        });
        
        await tx.request()
          .input("dni", sql.VarChar(20), desercion.postulante_dni)
          .input("fecha", sql.Date, desercion.fecha_desercion)
          .input("motivo", sql.NVarChar(500), desercion.motivo)
          .input("capa", sql.Int, Number(desercion.capa_numero))
          .input("fechaInicio", sql.Date, desercion.fecha_inicio)
          .input("CampañaID", sql.Int, desercion.CampañaID)
          .query(`
            MERGE Deserciones_Formacion AS T
            USING (SELECT @dni AS dni, @capa AS capa, @CampañaID AS CampañaID) AS S
              ON T.postulante_dni = S.dni AND T.capa_numero = S.capa AND T.CampañaID = S.CampañaID
            WHEN MATCHED THEN
              UPDATE SET fecha_desercion = @fecha, motivo = @motivo, fecha_inicio = @fechaInicio
            WHEN NOT MATCHED THEN
              INSERT (postulante_dni,fecha_desercion,motivo,capa_numero,fecha_inicio,CampañaID)
              VALUES (@dni,@fecha,@motivo,@capa,@fechaInicio,@CampañaID);
          `);
        
        console.log(`✅ Deserción ${i + 1} procesada exitosamente`);
      }
      
      console.log('✅ Todas las deserciones procesadas, haciendo commit...');
      await tx.commit();
      console.log('✅ Transacción commitada exitosamente');
      
      res.json({ success: true, message: 'Deserciones guardadas correctamente' });
      
    } catch (error) {
      console.log('❌ Error durante el procesamiento, haciendo rollback...');
      await tx.rollback();
      console.log('✅ Rollback completado');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error en saveDeserciones:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      stack: error.stack
    });
  }
};

// Guardar evaluaciones en lote
const saveEvaluaciones = async (req, res) => {
  try {
    const evaluaciones = req.body;
    
    if (!Array.isArray(evaluaciones) || evaluaciones.length === 0) {
      return res.status(400).json({ error: 'Datos de evaluación inválidos' });
    }

    const pool = await getConnection();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    
    try {
      for (const evaluacion of evaluaciones) {
        await tx.request()
          .input("dni", sql.VarChar(20), evaluacion.postulante_dni)
          .input("fecha", sql.Date, evaluacion.fecha_evaluacion)
          .input("nota", sql.Int, evaluacion.nota)
          .query(`
            MERGE Evaluaciones_Formacion AS T
            USING (SELECT @dni AS dni, @fecha AS fecha) AS S
              ON T.postulante_dni = S.dni AND T.fecha_evaluacion = S.fecha
            WHEN MATCHED THEN
              UPDATE SET nota = @nota
            WHEN NOT MATCHED THEN
              INSERT (postulante_dni,fecha_evaluacion,nota)
              VALUES (@dni,@fecha,@nota);
          `);
      }
      
      await tx.commit();
      res.json({ success: true, message: 'Evaluaciones guardadas correctamente' });
      
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error en saveEvaluaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar estado de postulantes
const updateEstadoPostulantes = async (req, res) => {
  try {
    const postulantes = req.body;
    
    if (!Array.isArray(postulantes) || postulantes.length === 0) {
      return res.status(400).json({ error: 'Datos de postulantes inválidos' });
    }

    const pool = await getConnection();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    
    try {
      for (const postulante of postulantes) {
        if (postulante.estado === 'Desaprobado' && postulante.fechaCese) {
          await tx.request()
            .input("dni", sql.VarChar(20), postulante.dni)
            .input("CampañaID", sql.Int, Number(postulante.CampañaID))
            .input("fechaInicio", sql.Date, postulante.fecha_inicio)
            .input("estado", sql.VarChar(20), postulante.estado)
            .input("fechaCese", sql.Date, postulante.fechaCese)
            .query(`
              UPDATE Postulantes_En_Formacion
              SET EstadoPostulante = @estado, FechaCese = @fechaCese
              WHERE DNI = @dni AND CampañaID = @CampañaID AND FechaInicio = @fechaInicio
            `);
        } else if (postulante.estado === 'Contratado') {
          await tx.request()
            .input("dni", sql.VarChar(20), postulante.dni)
            .input("CampañaID", sql.Int, Number(postulante.CampañaID))
            .input("fechaInicio", sql.Date, postulante.fecha_inicio)
            .input("estado", sql.VarChar(20), postulante.estado)
            .query(`
              UPDATE Postulantes_En_Formacion
              SET EstadoPostulante = @estado, FechaCese = NULL
              WHERE DNI = @dni AND CampañaID = @CampañaID AND FechaInicio = @fechaInicio
            `);
        } else {
          await tx.request()
            .input("dni", sql.VarChar(20), postulante.dni)
            .input("CampañaID", sql.Int, Number(postulante.CampañaID))
            .input("fechaInicio", sql.Date, postulante.fecha_inicio)
            .input("estado", sql.VarChar(20), postulante.estado)
            .query(`
              UPDATE Postulantes_En_Formacion
              SET EstadoPostulante = @estado
              WHERE DNI = @dni AND CampañaID = @CampañaID AND FechaInicio = @fechaInicio
            `);
        }
      }
      
      await tx.commit();
      res.json({ success: true, message: 'Estados de postulantes actualizados correctamente' });
      
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error en updateEstadoPostulantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar horarios de postulantes
const updateHorariosPostulantes = async (req, res) => {
  try {
    const postulantes = req.body;
    
    if (!Array.isArray(postulantes) || postulantes.length === 0) {
      return res.status(400).json({ error: 'Datos de postulantes inválidos' });
    }

    const pool = await getConnection();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    
    try {
      for (const postulante of postulantes) {
        // Buscar el GrupoID correspondiente al nombreGrupo
        const result = await tx.request()
          .input('nombreGrupo', sql.VarChar(255), postulante.nombreGrupo)
          .query('SELECT GrupoID FROM GruposDeHorario WHERE NombreGrupo = @nombreGrupo');
        
        const grupo = result.recordset[0];
        if (!grupo) continue; // Si no existe, no actualiza

        await tx.request()
          .input('dni', sql.VarChar(20), postulante.dni)
          .input('grupoID', sql.Int, grupo.GrupoID)
          .query(`
            UPDATE Postulantes_En_Formacion
            SET GrupoHorarioID = @grupoID
            WHERE DNI = @dni
          `);
      }
      
      await tx.commit();
      res.json({ success: true, message: 'Horarios de postulantes actualizados correctamente' });
      
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error en updateHorariosPostulantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



// Endpoint de prueba
const test = async (req, res) => {
  try {
    console.log('🧪 Endpoint de prueba funcionando');
    res.json({ message: 'Endpoint de capacitaciones funcionando correctamente' });
  } catch (error) {
    console.error('Error en test:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función temporal para generar token JWT (SOLO PARA PRUEBAS)
const generateToken = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni) {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    // Verificar que el usuario existe y es capacitador
    const pool = await getConnection();
    const request = pool.request()
      .input("dni", sql.VarChar(20), dni);
    
    const query = `
      SELECT DNI, Nombres, ApellidoPaterno, CargoID, EstadoEmpleado 
      FROM PRI.Empleados 
      WHERE DNI = @dni AND CargoID = 7 AND EstadoEmpleado = 'Activo'
    `;
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Capacitador no encontrado o no autorizado' });
    }

    const user = result.recordset[0];
    
    // Generar token JWT
    const jwt = require('jsonwebtoken');
    const payload = {
      dni: user.DNI,
      cargoID: user.CargoID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 horas
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta_simple_2024');
    
    res.json({
      success: true,
      token,
      user: {
        dni: user.DNI,
        nombres: user.Nombres,
        apellidoPaterno: user.ApellidoPaterno,
        cargoID: user.CargoID
      }
    });
    
  } catch (error) {
    console.error('Error en generateToken:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getCapas,
  getMeses,
  getPostulantes,
  getDeserciones,
  getEvaluaciones,
  getHorariosBase,
  saveAsistencias,
  saveDeserciones,
  saveEvaluaciones,
  updateEstadoPostulantes,
  updateHorariosPostulantes,
  test,
  generateToken // Agregar esta función
};
