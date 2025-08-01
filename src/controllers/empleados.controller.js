const { validationResult } = require('express-validator');
const { pool, sql } = require('../db');

// Lookup para autocompletar DNI (ahora acepta varios cargos: ?cargo=2,8)
exports.lookupEmpleados = async (req, res) => {
  const { cargo = "", search = "" } = req.query;
  if (!cargo) return res.status(400).json({ error: "cargo requerido" });

  try {
    const conn = await pool;

    const result = await conn.request()
      .input("cargosCSV", sql.VarChar, cargo)               // ej. "2,8"
      .input("search"   , sql.VarChar, `%${search}%`)
      .query(`
        DECLARE @cargos TABLE(id INT);
        INSERT INTO @cargos
        SELECT TRY_CAST(value AS INT)
        FROM STRING_SPLIT(@cargosCSV, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;

        SELECT TOP 10
               DNI,
               Nombres + ' ' + ApellidoPaterno AS NombreCompleto
        FROM PRI.Empleados
        WHERE CargoID IN (SELECT id FROM @cargos)
          AND EstadoEmpleado = 'Activo'
          AND DNI LIKE @search
        ORDER BY DNI;
      `);

    res.json(result.recordset);                             // [{ DNI, NombreCompleto }]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en lookup" });
  }
};

// Obtener empleado por DNI
exports.obtenerEmpleado = async (req, res) => {
  const { dni } = req.params;
  
  try {
    const conn = await pool;
    const result = await conn.request()
      .input('DNI', sql.VarChar(12), dni)
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno,
               FechaContratacion, FechaCese, EstadoEmpleado,
               JornadaID, CampañaID, CargoID, ModalidadID, GrupoHorarioID,
               SupervisorDNI, CoordinadorDNI, JefeDNI
        FROM PRI.Empleados 
        WHERE DNI = @DNI
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const empleado = result.recordset[0];
    
    // Convertir fecha a formato ISO para el input date
    if (empleado.FechaContratacion) {
      empleado.FechaContratacion = empleado.FechaContratacion.toISOString().split('T')[0];
    }

    res.json(empleado);
  } catch (err) {
    console.error('Error obteniendo empleado:', err);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

// Obtener horario del empleado
exports.obtenerHorarioEmpleado = async (req, res) => {
  const { dni } = req.params;
  
  try {
    const conn = await pool;
    const result = await conn.request()
      .input('DNI', sql.VarChar(12), dni)
      .query(`
        SELECT g.NombreGrupo, 
               LEFT(g.NombreGrupo, 
                    CASE WHEN CHARINDEX(' (Desc.', g.NombreGrupo) > 0
                         THEN CHARINDEX(' (Desc.', g.NombreGrupo) - 1
                         ELSE LEN(g.NombreGrupo)
                    END) AS NombreBase,
               hb.HoraEntrada,
               hb.HoraSalida
        FROM PRI.Empleados e
        JOIN dbo.GruposDeHorario g ON g.GrupoID = e.GrupoHorarioID
        LEFT JOIN dbo.Horarios_Base hb ON hb.NombreHorario = LEFT(g.NombreGrupo, 
                    CASE WHEN CHARINDEX(' (Desc.', g.NombreGrupo) > 0
                         THEN CHARINDEX(' (Desc.', g.NombreGrupo) - 1
                         ELSE LEN(g.NombreGrupo)
                    END)
        WHERE e.DNI = @DNI
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error obteniendo horario:', err);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
};

// Crear nuevo empleado
exports.crearEmpleado = async (req, res) => {
  // 1. Validaciones de express-validator
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

  const {
    DNI, Nombres, ApellidoPaterno, ApellidoMaterno = '',
    FechaContratacion,
    JornadaID, CampañaID, CargoID, ModalidadID,
    GrupoHorarioID,
    SupervisorDNI = null, CoordinadorDNI = null, JefeDNI = null
  } = req.body;

  try {
    const conn = await pool;
    // 2. Evitar DNI duplicado
    const existe = await conn.request()
      .input('DNI', sql.VarChar, DNI)
      .query('SELECT 1 FROM PRI.Empleados WHERE DNI = @DNI');
    if (existe.recordset.length) {
      return res.status(409).json({ error: 'El DNI ya existe' });
    }

    // 3. Insert con parámetros
    await conn.request()
      .input('DNI',               sql.VarChar, DNI)
      .input('Nombres',           sql.VarChar, Nombres)
      .input('ApellidoPaterno',   sql.VarChar, ApellidoPaterno)
      .input('ApellidoMaterno',   sql.VarChar, ApellidoMaterno)
      .input('FechaContratacion', sql.Date,    FechaContratacion)
      .input('Estado',            sql.VarChar, 'Activo')
      .input('JornadaID',         sql.Int,    JornadaID)
      .input('CampañaID',         sql.Int,    CampañaID)
      .input('CargoID',           sql.Int,    CargoID)
      .input('ModalidadID',       sql.Int,    ModalidadID)
      .input('GrupoHorarioID',    sql.Int,    GrupoHorarioID)
      .input('SupervisorDNI',     sql.VarChar, SupervisorDNI)
      .input('CoordinadorDNI',    sql.VarChar, CoordinadorDNI)
      .input('JefeDNI',           sql.VarChar, JefeDNI)
      .query(`
        INSERT INTO PRI.Empleados
          (DNI, Nombres, ApellidoPaterno, ApellidoMaterno, FechaContratacion,
           FechaCese, EstadoEmpleado,
           JornadaID, CampañaID, CargoID, ModalidadID, GrupoHorarioID,
           SupervisorDNI, CoordinadorDNI, JefeDNI)
        VALUES
          (@DNI, @Nombres, @ApellidoPaterno, @ApellidoMaterno, @FechaContratacion,
           NULL, @Estado,
           @JornadaID, @CampañaID, @CargoID, @ModalidadID, @GrupoHorarioID,
           @SupervisorDNI, @CoordinadorDNI, @JefeDNI)
      `);

    res.status(201).json({ mensaje: 'Empleado creado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al insertar empleado' });
  }
};

// Actualizar empleado existente
exports.actualizarEmpleado = async (req, res) => {
  // 1. Validaciones de express-validator
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

  const { dni } = req.params;
  const {
    Nombres, ApellidoPaterno, ApellidoMaterno = '',
    FechaContratacion,
    JornadaID, CampañaID, CargoID, ModalidadID,
    GrupoHorarioID,
    SupervisorDNI = null, CoordinadorDNI = null, JefeDNI = null
  } = req.body;

  try {
    const conn = await pool;
    
    // 2. Verificar que el empleado existe
    const existe = await conn.request()
      .input('DNI', sql.VarChar, dni)
      .query('SELECT 1 FROM PRI.Empleados WHERE DNI = @DNI');
    if (existe.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // 3. Update con parámetros
    await conn.request()
      .input('DNI',               sql.VarChar, dni)
      .input('Nombres',           sql.VarChar, Nombres)
      .input('ApellidoPaterno',   sql.VarChar, ApellidoPaterno)
      .input('ApellidoMaterno',   sql.VarChar, ApellidoMaterno)
      .input('FechaContratacion', sql.Date,    FechaContratacion)
      .input('JornadaID',         sql.Int,    JornadaID)
      .input('CampañaID',         sql.Int,    CampañaID)
      .input('CargoID',           sql.Int,    CargoID)
      .input('ModalidadID',       sql.Int,    ModalidadID)
      .input('GrupoHorarioID',    sql.Int,    GrupoHorarioID)
      .input('SupervisorDNI',     sql.VarChar, SupervisorDNI)
      .input('CoordinadorDNI',    sql.VarChar, CoordinadorDNI)
      .input('JefeDNI',           sql.VarChar, JefeDNI)
      .query(`
        UPDATE PRI.Empleados
        SET Nombres = @Nombres,
            ApellidoPaterno = @ApellidoPaterno,
            ApellidoMaterno = @ApellidoMaterno,
            FechaContratacion = @FechaContratacion,
            JornadaID = @JornadaID,
            CampañaID = @CampañaID,
            CargoID = @CargoID,
            ModalidadID = @ModalidadID,
            GrupoHorarioID = @GrupoHorarioID,
            SupervisorDNI = @SupervisorDNI,
            CoordinadorDNI = @CoordinadorDNI,
            JefeDNI = @JefeDNI
        WHERE DNI = @DNI
      `);

    res.json({ mensaje: 'Empleado actualizado correctamente' });
  } catch (err) {
    console.error('Error actualizando empleado:', err);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

// Buscar empleados por DNI o nombre (para autocompletar)
exports.buscarEmpleados = async (req, res) => {
  const { search = "" } = req.query;
  
  if (!search || search.length < 2) {
    return res.json([]);
  }

  try {
    const conn = await pool;
    const result = await conn.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(`
        SELECT TOP 10
               DNI,
               Nombres + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') AS NombreCompleto,
               EstadoEmpleado
        FROM PRI.Empleados
        WHERE (DNI LIKE @search OR 
               Nombres + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') LIKE @search)
          AND EstadoEmpleado = 'Activo'
        ORDER BY 
          CASE WHEN DNI LIKE @search THEN 1 ELSE 2 END,
          DNI
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error buscando empleados:', err);
    res.status(500).json({ error: 'Error al buscar empleados' });
  }
};
