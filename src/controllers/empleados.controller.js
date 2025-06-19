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
