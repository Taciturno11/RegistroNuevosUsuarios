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
          AND p.CampañaID = @camp
          AND CONVERT(varchar, p.FechaInicio, 23) = CONVERT(varchar, d.fecha_inicio, 23)
          AND d.CampañaID = @camp
        LEFT JOIN PRI.Campanias c ON d.CampañaID = c.CampañaID
        WHERE p.DNI_Capacitador = @dniCap
          AND p.CampañaID = @camp
          AND FORMAT(p.FechaInicio,'yyyy-MM') = @prefijo
          AND d.capa_numero = @capa
          AND d.CampañaID = @camp
          AND CONVERT(varchar, p.FechaInicio, 23) = CONVERT(varchar, d.fecha_inicio, 23)
        ORDER BY d.fecha_desercion
      `);

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
  try {
    const asistencias = req.body;
    
    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return res.status(400).json({ error: 'Datos de asistencia inválidos' });
    }

    const pool = await getConnection();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    
    try {
      for (const asistencia of asistencias) {
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
      }
      
      await tx.commit();
      res.json({ success: true, message: 'Asistencias guardadas correctamente' });
      
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error en saveAsistencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Guardar deserciones en lote
const saveDeserciones = async (req, res) => {
  try {
    const deserciones = req.body;
    
    if (!Array.isArray(deserciones) || deserciones.length === 0) {
      return res.status(400).json({ error: 'Datos de deserción inválidos' });
    }

    const pool = await getConnection();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    
    try {
      for (const desercion of deserciones) {
        await tx.request()
          .input("dni", sql.VarChar(20), desercion.postulante_dni)
          .input("fechaDes", sql.Date, desercion.fecha_desercion)
          .input("mot", sql.NVarChar(250), desercion.motivo)
          .input("capa", sql.Int, desercion.capa_numero)
          .input("CampañaID", sql.Int, desercion.CampañaID)
          .input("fechaInicio", sql.Date, desercion.fecha_inicio)
          .query(`
            MERGE Deserciones_Formacion AS T
            USING (SELECT @dni AS dni, @capa AS capa, @CampañaID AS CampañaID, @fechaInicio AS fechaInicio, @fechaDes AS fechaDes) AS S
              ON T.postulante_dni = S.dni AND T.capa_numero = S.capa AND T.CampañaID = S.CampañaID AND T.fecha_inicio = S.fechaInicio AND T.fecha_desercion = S.fechaDes
            WHEN MATCHED THEN
              UPDATE SET motivo = @mot
            WHEN NOT MATCHED THEN
              INSERT (postulante_dni, capa_numero, fecha_desercion, motivo, CampañaID, fecha_inicio)
              VALUES (@dni, @capa, @fechaDes, @mot, @CampañaID, @fechaInicio);
          `);
      }
      
      await tx.commit();
      res.json({ success: true, message: 'Deserciones guardadas correctamente' });
      
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error en saveDeserciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
