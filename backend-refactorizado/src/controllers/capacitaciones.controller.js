const sql = require('mssql');
const { getConnection } = require('../config/database');

// Helper: new Request() con pool global (igual que el proyecto original)
const R = async () => {
  const pool = await getConnection();
  return pool.request();
};

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

// Endpoint para verificar tablas disponibles
const verificarTablas = async (req, res) => {
  try {
    console.log('🔍 Verificando tablas disponibles en la base de datos');
    
    const pool = await getConnection();
    
    // Consulta para obtener todas las tablas
    const query = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const { recordset: tables } = await pool.request().query(query);
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    
    // Buscar tablas relacionadas con capacitaciones
    const tablasCapacitaciones = tables.filter(table => 
      table.TABLE_NAME.toLowerCase().includes('capacitacion') ||
      table.TABLE_NAME.toLowerCase().includes('postulante') ||
      table.TABLE_NAME.toLowerCase().includes('campania') ||
      table.TABLE_NAME.toLowerCase().includes('formacion')
    );
    
    res.json({
      success: true,
      message: 'Tablas disponibles verificadas',
      totalTables: tables.length,
      allTables: tables,
      tablasCapacitaciones: tablasCapacitaciones
    });
    
  } catch (error) {
    console.error('❌ Error en verificarTablas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar tablas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Endpoint para verificar estructura de tablas
const verificarEstructuraTablas = async (req, res) => {
  try {
    console.log('🔍 Verificando estructura de tablas de capacitaciones');
    
    const pool = await getConnection();
    
    // Verificar columnas de Postulantes_En_Formacion
    const queryPostulantes = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Postulantes_En_Formacion' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `;
    
    const { recordset: columnasPostulantes } = await pool.request().query(queryPostulantes);
    console.log(`📋 Columnas de Postulantes_En_Formacion: ${columnasPostulantes.length}`);
    
    // Verificar columnas de PRI.Campanias
    const queryCampanias = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Campanias' AND TABLE_SCHEMA = 'PRI'
      ORDER BY ORDINAL_POSITION
    `;
    
    const { recordset: columnasCampanias } = await pool.request().query(queryCampanias);
    console.log(`📋 Columnas de PRI.Campanias: ${columnasCampanias.length}`);
    
    // Verificar columnas de PRI.Empleados
    const queryEmpleados = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Empleados' AND TABLE_SCHEMA = 'PRI'
      ORDER BY ORDINAL_POSITION
    `;
    
    const { recordset: columnasEmpleados } = await pool.request().query(queryEmpleados);
    console.log(`📋 Columnas de PRI.Empleados: ${columnasEmpleados.length}`);
    
    res.json({
      success: true,
      message: 'Estructura de tablas verificada',
      tablas: {
        Postulantes_En_Formacion: columnasPostulantes,
        PRI_Campanias: columnasCampanias,
        PRI_Empleados: columnasEmpleados
      }
    });
    
  } catch (error) {
    console.error('❌ Error en verificarEstructuraTablas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estructura de tablas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Endpoint de prueba para consulta de campañas
const probarConsultaCampanias = async (req, res) => {
  try {
    console.log('🧪 Probando consulta de campañas paso a paso');
    
    const pool = await getConnection();
    console.log('✅ Conexión a base de datos establecida');
    
    // Paso 1: Verificar si la tabla PRI.Campanias existe
    const queryTabla = `
      SELECT COUNT(*) as total
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'PRI' AND TABLE_NAME = 'Campanias'
    `;
    
    const { recordset: tablaResult } = await pool.request().query(queryTabla);
    console.log(`📋 Tabla PRI.Campanias existe: ${tablaResult[0].total > 0}`);
    
    if (tablaResult[0].total === 0) {
      return res.json({
        success: false,
        message: 'Tabla PRI.Campanias no existe',
        step: 'verificacion_tabla'
      });
    }
    
    // Paso 2: Verificar si la tabla Postulantes_En_Formacion existe
    const queryTabla2 = `
      SELECT COUNT(*) as total
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Postulantes_En_Formacion'
    `;
    
    const { recordset: tabla2Result } = await pool.request().query(queryTabla2);
    console.log(`📋 Tabla Postulantes_En_Formacion existe: ${tabla2Result[0].total > 0}`);
    
    if (tabla2Result[0].total === 0) {
      return res.json({
        success: false,
        message: 'Tabla Postulantes_En_Formacion no existe',
        step: 'verificacion_tabla2'
      });
    }
    
    // Paso 3: Probar consulta simple en PRI.Campanias
    const querySimple = `
      SELECT TOP 5 CampañaID, NombreCampaña, Estado
      FROM PRI.Campanias
    `;
    
    const { recordset: campaniasResult } = await pool.request().query(querySimple);
    console.log(`🏢 Campañas encontradas: ${campaniasResult.length}`);
    
    // Paso 4: Probar consulta simple en Postulantes_En_Formacion
    const querySimple2 = `
      SELECT TOP 5 DNI, CampañaID, FechaInicio
      FROM Postulantes_En_Formacion
    `;
    
    const { recordset: postulantesResult } = await pool.request().query(querySimple2);
    console.log(`👥 Postulantes encontrados: ${postulantesResult.length}`);
    
    // Paso 5: Probar la consulta completa
    const queryCompleta = `
      SELECT DISTINCT 
        c.CampañaID as ID,
        c.NombreCampaña as Nombre,
        c.Descripcion,
        c.FechaInicio,
        c.FechaFin,
        c.Estado
      FROM PRI.Campanias c
      INNER JOIN Postulantes_En_Formacion pf ON c.CampañaID = pf.CampañaID
      WHERE c.Estado = 'Activa'
      ORDER BY c.FechaInicio DESC
    `;
    
    const { recordset: consultaCompleta } = await pool.request().query(queryCompleta);
    console.log(`🔗 Consulta completa exitosa: ${consultaCompleta.length} resultados`);
    
    res.json({
      success: true,
      message: 'Prueba de consulta completada exitosamente',
      resultados: {
        tablaCampanias: tablaResult[0].total > 0,
        tablaPostulantes: tabla2Result[0].total > 0,
        campaniasSimples: campaniasResult.length,
        postulantesSimples: postulantesResult.length,
        consultaCompleta: consultaCompleta.length
      },
      datos: {
        campanias: campaniasResult,
        postulantes: postulantesResult,
        consultaCompleta: consultaCompleta
      }
    });
    
  } catch (error) {
    console.error('❌ Error en probarConsultaCampanias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al probar consulta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Función temporal para generar token JWT (SOLO PARA PRUEBAS)
const generateToken = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni) {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    // Verificar que el usuario existe y es capacitador o jefa
    const pool = await getConnection();
    const request = pool.request()
      .input("dni", sql.VarChar(20), dni);
    
    const query = `
      SELECT DNI, Nombres, ApellidoPaterno, CargoID, EstadoEmpleado 
      FROM PRI.Empleados 
      WHERE DNI = @dni AND CargoID IN (7, 8) AND EstadoEmpleado = 'Activo'
    `;
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado o no autorizado' });
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

// ============================================================================
// DASHBOARD DE JEFA - ENDPOINTS ESPECIALES PARA JEFAS DE CAPACITACIÓN
// ============================================================================

/**
 * Obtener datos del dashboard de jefa
 * GET /api/capacitaciones/dashboard-jefa/:dni
 */
const obtenerDashboardJefa = async (req, res) => {
  try {
    const { dni } = req.params;
    const { campania, mes, capa } = req.query;
    
    console.log(`📊 Dashboard Jefa solicitado para DNI: ${dni}`);
    console.log(`🔍 Filtros aplicados:`, { campania, mes, capa });

    // Verificar que el usuario sea jefa
    if (req.user.role !== 'jefe') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo las jefas pueden acceder a este dashboard.'
      });
    }

    // Construir consulta base - USANDO LAS TABLAS DEL PROYECTO ORIGINAL
    let query = `
      SELECT DISTINCT
        pf.DNI,
        CONCAT(e.Nombres,' ',e.ApellidoPaterno,' ',e.ApellidoMaterno) as NombreCompleto,
        pf.CampañaID,
        pf.FechaInicio,
        pf.FechaCese,
        pf.EstadoPostulante as Estado,
        pf.DNI_Capacitador as CapacitadorID,
        CONCAT(cap.Nombres,' ',cap.ApellidoPaterno,' ',cap.ApellidoMaterno) as CapacitadorNombre,
        c.NombreCampaña as CampaniaNombre
      FROM Postulantes_En_Formacion pf
      LEFT JOIN PRI.Empleados e ON pf.DNI = e.DNI
      LEFT JOIN PRI.Empleados cap ON pf.DNI_Capacitador = cap.DNI
      LEFT JOIN PRI.Campanias c ON pf.CampañaID = c.CampañaID
      WHERE 1=1
    `;

    // Aplicar filtros usando parámetros nombrados (igual que el proyecto original)
    if (campania) {
      query += ` AND pf.CampañaID = @campania`;
    }

    if (mes) {
      query += ` AND FORMAT(pf.FechaInicio, 'yyyy-MM') = @mes`;
    }

    if (capa) {
      query += ` AND pf.Capa = @capa`;
    }

    query += ` ORDER BY pf.FechaInicio DESC`;

    console.log(`🔍 Query ejecutándose:`, query);

    // Ejecutar consulta usando getConnection() directamente
    const pool = await getConnection();
    const request = pool.request();
    
    if (campania) request.input("campania", sql.Int, parseInt(campania));
    if (mes) request.input("mes", sql.VarChar(7), mes);
    if (capa) request.input("capa", sql.Int, parseInt(capa));

    const { recordset: rows } = await request.query(query);
    console.log(`📊 Registros obtenidos: ${rows.length}`);

    if (!rows || rows.length === 0) {
      return res.json({
        totales: {
          postulantes: 0,
          deserciones: 0,
          desercionesATH1: 0,
          desercionesATH2: 0,
          desercionesATHFormacion: 0,
          contratados: 0,
          porcentajeExito: 0,
          porcentajeDesercionesATH1: 0,
          porcentajeDesercionesATH2: 0,
          porcentajeDesercionesATHFormacion: 0
        },
        capacitadores: []
      });
    }

    // Obtener deserciones por separado para evitar duplicados
    let queryDeserciones = `
      SELECT 
        df.postulante_dni,
        df.fecha_desercion,
        pf.FechaInicio,
        pf.DNI_Capacitador
      FROM Deserciones_Formacion df
      JOIN Postulantes_En_Formacion pf ON df.postulante_dni = pf.DNI
      WHERE 1=1
    `;
    
    if (campania) queryDeserciones += ` AND pf.CampañaID = @campania`;
    if (mes) queryDeserciones += ` AND FORMAT(pf.FechaInicio, 'yyyy-MM') = @mes`;
    
    const requestDeserciones = pool.request();
    
    if (campania) requestDeserciones.input("campania", sql.Int, parseInt(campania));
    if (mes) requestDeserciones.input("mes", sql.VarChar(7), mes);
    
    const { recordset: desercionesRows } = await requestDeserciones.query(queryDeserciones);
    console.log(`📊 Deserciones obtenidas: ${desercionesRows.length}`);

    // Procesar datos para obtener totales y métricas por capacitador
    const totales = {
      postulantes: rows.length,
      deserciones: 0,
      desercionesATH1: 0,
      desercionesATH2: 0,
      desercionesATHFormacion: 0,
      contratados: 0
    };

    // Agrupar por capacitador
    const capacitadoresMap = new Map();

    // Procesar deserciones primero
    desercionesRows.forEach(desercion => {
      totales.deserciones++;
      
      if (desercion.fecha_desercion && desercion.FechaInicio) {
        const diasDiferencia = Math.floor((new Date(desercion.fecha_desercion) - new Date(desercion.FechaInicio)) / (1000 * 60 * 60 * 24));
        
        if (diasDiferencia === 0) {
          totales.desercionesATH1++;
        } else if (diasDiferencia === 1) {
          totales.desercionesATH2++;
        } else if (diasDiferencia >= 2) {
          totales.desercionesATHFormacion++;
        }
      }
    });

    // Procesar postulantes
    rows.forEach(row => {
      // Contar contratados
      if (row.Estado === 'Contratado') {
        totales.contratados++;
      }

      // Agrupar por capacitador
      if (row.CapacitadorID) {
        if (!capacitadoresMap.has(row.CapacitadorID)) {
          capacitadoresMap.set(row.CapacitadorID, {
            dni: row.CapacitadorID,
            nombreCompleto: row.CapacitadorNombre,
            postulantes: 0,
            deserciones: 0,
            desercionesATH1: 0,
            desercionesATH2: 0,
            desercionesATHFormacion: 0,
            contratados: 0
          });
        }

        const cap = capacitadoresMap.get(row.CapacitadorID);
        cap.postulantes++;

        if (row.Estado === 'Contratado') {
          cap.contratados++;
        }
      }
    });

    // Procesar deserciones por capacitador
    desercionesRows.forEach(desercion => {
      if (capacitadoresMap.has(desercion.DNI_Capacitador)) {
        const cap = capacitadoresMap.get(desercion.DNI_Capacitador);
        cap.deserciones++;
        
        if (desercion.fecha_desercion && desercion.FechaInicio) {
          const diasDiferencia = Math.floor((new Date(desercion.fecha_desercion) - new Date(desercion.FechaInicio)) / (1000 * 60 * 60 * 24));
          
          if (diasDiferencia === 0) {
            cap.desercionesATH1++;
          } else if (diasDiferencia === 1) {
            cap.desercionesATH2++;
          } else if (diasDiferencia >= 2) {
            cap.desercionesATHFormacion++;
          }
        }
      }
    });

    // Calcular porcentajes
    if (totales.postulantes > 0) {
      totales.porcentajeExito = Math.round((totales.contratados / totales.postulantes) * 100);
      totales.porcentajeDesercionesATH1 = Math.round((totales.desercionesATH1 / totales.postulantes) * 100);
      totales.porcentajeDesercionesATH2 = Math.round((totales.desercionesATH2 / totales.postulantes) * 100);
      totales.porcentajeDesercionesATHFormacion = Math.round((totales.desercionesATHFormacion / totales.postulantes) * 100);
    }

    // Convertir map a array y calcular porcentajes por capacitador
    const capacitadores = Array.from(capacitadoresMap.values()).map(cap => {
      const porcentajeExito = cap.postulantes > 0 ? Math.round((cap.contratados / cap.postulantes) * 100) : 0;
      return { ...cap, porcentajeExito };
    });

    // Ordenar capacitadores por porcentaje de éxito (descendente)
    capacitadores.sort((a, b) => b.porcentajeExito - a.porcentajeExito);

    console.log(`📊 Totales calculados:`, totales);
    console.log(`👥 Capacitadores procesados: ${capacitadores.length}`);

    res.json({
      totales,
      capacitadores
    });

  } catch (error) {
    console.error('❌ Error en obtenerDashboardJefa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener datos del dashboard de jefa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener campañas disponibles para el dashboard de jefa
 * GET /api/capacitaciones/dashboard-jefa/campanias
 */
const obtenerCampaniasDashboardJefa = async (req, res) => {
  try {
    console.log('🏢 Obteniendo campañas para dashboard de jefa');

    const query = `
      SELECT DISTINCT 
        c.CampañaID as id,
        c.NombreCampaña as nombre
      FROM PRI.Campanias c
      INNER JOIN Postulantes_En_Formacion pf ON c.CampañaID = pf.CampañaID
      ORDER BY c.CampañaID DESC
    `;

    const pool = await getConnection();
    const { recordset: rows } = await pool.request().query(query);
    console.log(`🏢 Campañas encontradas: ${rows.length}`);

    res.json(rows);

  } catch (error) {
    console.error('❌ Error en obtenerCampaniasDashboardJefa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener campañas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener meses disponibles para el dashboard de jefa
 * GET /api/capacitaciones/dashboard-jefa/meses
 */
const obtenerMesesDashboardJefa = async (req, res) => {
  try {
    console.log('📅 Obteniendo meses disponibles para dashboard de jefa');

    const query = `
      SELECT DISTINCT 
        YEAR(FechaInicio) as año,
        MONTH(FechaInicio) as mes,
        CONCAT(YEAR(FechaInicio), '-', RIGHT('0' + CAST(MONTH(FechaInicio) AS VARCHAR(2)), 2)) as formatoFecha
      FROM Postulantes_En_Formacion 
      WHERE FechaInicio IS NOT NULL
      ORDER BY año DESC, mes DESC
    `;

    const pool = await getConnection();
    const { recordset: rows } = await pool.request().query(query);
    console.log(`📅 Meses encontrados: ${rows.length}`);

    // Convertir a formato más amigable
    const meses = rows.map(row => ({
      mes: row.formatoFecha,
      nombre: row.formatoFecha
    }));

    res.json(meses);

  } catch (error) {
    console.error('❌ Error en obtenerMesesDashboardJefa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener meses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener capas disponibles para una campaña específica
 * GET /api/capacitaciones/dashboard-jefa/capas?campania=ID
 */
const obtenerCapasDashboardJefa = async (req, res) => {
  try {
    const { campania } = req.query;
    
    if (!campania) {
      return res.status(400).json({
        success: false,
        message: 'ID de campaña es requerido'
      });
    }

    console.log(`🔍 Obteniendo capas para campaña: ${campania}`);

    const query = `
      SELECT DISTINCT 
        ROW_NUMBER() OVER (ORDER BY pf.FechaInicio) as capa,
        pf.FechaInicio as fechaInicio,
        pf.FechaCese,
        COUNT(*) as totalPostulantes
      FROM Postulantes_En_Formacion pf
      WHERE pf.CampañaID = @campania
      GROUP BY pf.FechaInicio, pf.FechaCese
      ORDER BY pf.FechaInicio DESC
    `;

    const pool = await getConnection();
    const { recordset: rows } = await pool.request()
      .input("campania", sql.Int, parseInt(campania))
      .query(query);
    console.log(`🔍 Capas encontradas: ${rows.length}`);

    res.json(rows);

  } catch (error) {
    console.error('❌ Error en obtenerCapasDashboardJefa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener capas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  generateToken, // Agregar esta función
  verificarTablas, // Agregar endpoint de verificación
  verificarEstructuraTablas, // Agregar endpoint de estructura
  probarConsultaCampanias, // Agregar endpoint de prueba
  
  // Nuevos endpoints para dashboard de jefa
  obtenerDashboardJefa,
  obtenerCampaniasDashboardJefa,
  obtenerMesesDashboardJefa,
  obtenerCapasDashboardJefa
};
