const { executeQuery, sql } = require('../config/database');

// ========================================
// JORNADAS
// ========================================

// Obtener todas las jornadas
exports.getAllJornadas = async (req, res) => {
  try {
    const query = 'SELECT JornadaID, NombreJornada FROM PRI.Jornada ORDER BY NombreJornada';
    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Jornadas obtenidas exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Error obteniendo jornadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nueva jornada
exports.createJornada = async (req, res) => {
  try {
    const { nombreJornada } = req.body;

    if (!nombreJornada) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de jornada es requerido',
        error: 'MISSING_JORNADA_NAME'
      });
    }

    const insertQuery = 'INSERT INTO PRI.Jornada (NombreJornada) VALUES (@NombreJornada)';
    await executeQuery(insertQuery, [
      { name: 'NombreJornada', type: sql.VarChar, value: nombreJornada }
    ]);

    res.status(201).json({
      success: true,
      message: 'Jornada creada exitosamente',
      data: { nombreJornada }
    });
  } catch (error) {
    console.error('❌ Error creando jornada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// CARGOS
// ========================================

// Obtener todos los cargos
exports.getAllCargos = async (req, res) => {
  try {
    const query = 'SELECT CargoID, NombreCargo FROM PRI.Cargos ORDER BY NombreCargo';
    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Cargos obtenidos exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Error obteniendo cargos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nuevo cargo
exports.createCargo = async (req, res) => {
  try {
    const { nombreCargo } = req.body;

    if (!nombreCargo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de cargo es requerido',
        error: 'MISSING_CARGO_NAME'
      });
    }

    const insertQuery = 'INSERT INTO PRI.Cargos (NombreCargo) VALUES (@NombreCargo)';
    await executeQuery(insertQuery, [
      { name: 'NombreCargo', type: sql.VarChar, value: nombreCargo }
    ]);

    res.status(201).json({
      success: true,
      message: 'Cargo creado exitosamente',
      data: { nombreCargo }
    });
  } catch (error) {
    console.error('❌ Error creando cargo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// CAMPAÑAS
// ========================================

// Obtener todas las campañas
exports.getAllCampanias = async (req, res) => {
  try {
    const query = 'SELECT CampañaID, NombreCampaña FROM PRI.Campanias ORDER BY NombreCampaña';
    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Campañas obtenidas exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Error obteniendo campañas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nueva campaña
exports.createCampania = async (req, res) => {
  try {
    const { nombreCampaña } = req.body;

    if (!nombreCampaña) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de campaña es requerido',
        error: 'MISSING_CAMPANIA_NAME'
      });
    }

    const insertQuery = 'INSERT INTO PRI.Campanias (NombreCampaña) VALUES (@NombreCampaña)';
    await executeQuery(insertQuery, [
      { name: 'NombreCampaña', type: sql.VarChar, value: nombreCampaña }
    ]);

    res.status(201).json({
      success: true,
      message: 'Campaña creada exitosamente',
      data: { nombreCampaña }
    });
  } catch (error) {
    console.error('❌ Error creando campaña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// MODALIDADES DE TRABAJO
// ========================================

// Obtener todas las modalidades
exports.getAllModalidades = async (req, res) => {
  try {
    const query = 'SELECT ModalidadID, NombreModalidad FROM PRI.ModalidadesTrabajo ORDER BY NombreModalidad';
    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Modalidades obtenidas exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Error obteniendo modalidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nueva modalidad
exports.createModalidad = async (req, res) => {
  try {
    const { nombreModalidad } = req.body;

    if (!nombreModalidad) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de modalidad es requerido',
        error: 'MISSING_MODALIDAD_NAME'
      });
    }

    const insertQuery = 'INSERT INTO PRI.ModalidadesTrabajo (NombreModalidad) VALUES (@NombreModalidad)';
    await executeQuery(insertQuery, [
      { name: 'NombreModalidad', type: sql.VarChar, value: nombreModalidad }
    ]);

    res.status(201).json({
      success: true,
      message: 'Modalidad creada exitosamente',
      data: { nombreModalidad }
    });
  } catch (error) {
    console.error('❌ Error creando modalidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// GRUPOS DE HORARIO
// ========================================

// Obtener todos los grupos de horario
exports.getAllGruposHorario = async (req, res) => {
  try {
    const query = `
      SELECT 
        gh.GrupoID,
        gh.NombreGrupo,
        gh.JornadaID,
        j.NombreJornada
      FROM dbo.GruposDeHorario gh
      LEFT JOIN PRI.Jornada j ON gh.JornadaID = j.JornadaID
      ORDER BY gh.NombreGrupo
    `;
    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Grupos de horario obtenidos exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Error obteniendo grupos de horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nuevo grupo de horario
exports.createGrupoHorario = async (req, res) => {
  try {
    const { nombreGrupo, jornadaID } = req.body;

    if (!nombreGrupo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del grupo es requerido',
        error: 'MISSING_GRUPO_NAME'
      });
    }

    const insertQuery = 'INSERT INTO dbo.GruposDeHorario (NombreGrupo, JornadaID) VALUES (@NombreGrupo, @JornadaID)';
    await executeQuery(insertQuery, [
      { name: 'NombreGrupo', type: sql.VarChar, value: nombreGrupo },
      { name: 'JornadaID', type: sql.Int, value: jornadaID || null }
    ]);

    res.status(201).json({
      success: true,
      message: 'Grupo de horario creado exitosamente',
      data: { nombreGrupo, jornadaID }
    });
  } catch (error) {
    console.error('❌ Error creando grupo de horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// HORARIOS BASE
// ========================================

// Obtener todos los horarios base
exports.getAllHorariosBase = async (req, res) => {
  try {
    const query = `
      SELECT 
        HorarioID,
        NombreHorario,
        HoraEntrada,
        HoraSalida,
        MinutosToleranciaEntrada,
        HorasJornada
      FROM dbo.Horarios_Base
      ORDER BY NombreHorario
    `;
    const result = await executeQuery(query);

    res.json({
      success: true,
      message: 'Horarios base obtenidos exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('❌ Error obteniendo horarios base:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nuevo horario base
exports.createHorarioBase = async (req, res) => {
  try {
    const {
      nombreHorario,
      horaEntrada,
      horaSalida,
      minutosToleranciaEntrada,
      horasJornada
    } = req.body;

    if (!nombreHorario || !horaEntrada || !horaSalida) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, hora de entrada y hora de salida son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const insertQuery = `
      INSERT INTO dbo.Horarios_Base (
        NombreHorario, HoraEntrada, HoraSalida, 
        MinutosToleranciaEntrada, HorasJornada
      ) VALUES (
        @NombreHorario, @HoraEntrada, @HoraSalida, 
        @MinutosToleranciaEntrada, @HorasJornada
      )
    `;

    await executeQuery(insertQuery, [
      { name: 'NombreHorario', type: sql.VarChar, value: nombreHorario },
      { name: 'HoraEntrada', type: sql.Time, value: horaEntrada },
      { name: 'HoraSalida', type: sql.Time, value: horaSalida },
      { name: 'MinutosToleranciaEntrada', type: sql.Int, value: minutosToleranciaEntrada || 0 },
      { name: 'HorasJornada', type: sql.Decimal, value: horasJornada || null }
    ]);

    res.status(201).json({
      success: true,
      message: 'Horario base creado exitosamente',
      data: { nombreHorario, horaEntrada, horaSalida }
    });
  } catch (error) {
    console.error('❌ Error creando horario base:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// CATÁLOGO COMPLETO
// ========================================

// Obtener todos los catálogos en una sola consulta
exports.getAllCatalogos = async (req, res) => {
  try {
    // Ejecutar todas las consultas en paralelo
    const [
      jornadasResult,
      cargosResult,
      campaniasResult,
      modalidadesResult,
      gruposResult,
      horariosResult
    ] = await Promise.all([
      executeQuery('SELECT JornadaID, NombreJornada FROM PRI.Jornada ORDER BY NombreJornada'),
      executeQuery('SELECT CargoID, NombreCargo FROM PRI.Cargos ORDER BY NombreCargo'),
      executeQuery('SELECT CampañaID, NombreCampaña FROM PRI.Campanias ORDER BY NombreCampaña'),
      executeQuery('SELECT ModalidadID, NombreModalidad FROM PRI.ModalidadesTrabajo ORDER BY NombreModalidad'),
      executeQuery('SELECT GrupoID, NombreGrupo FROM dbo.GruposDeHorario ORDER BY NombreGrupo'),
      executeQuery('SELECT HorarioID, NombreHorario FROM dbo.Horarios_Base ORDER BY NombreHorario')
    ]);

    res.json({
      success: true,
      message: 'Catálogos obtenidos exitosamente',
      data: {
        jornadas: jornadasResult.recordset,
        cargos: cargosResult.recordset,
        campanias: campaniasResult.recordset,
        modalidades: modalidadesResult.recordset,
        gruposHorario: gruposResult.recordset,
        horariosBase: horariosResult.recordset
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo catálogos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener todos los catálogos necesarios
exports.getCatalogos = async (req, res) => {
  try {
    // Obtener cargos
    const cargosQuery = `
      SELECT 
        CargoID as id,
        NombreCargo as nombre
      FROM PRI.Cargos 
      ORDER BY NombreCargo
    `;
    const cargosResult = await executeQuery(cargosQuery);

    // Obtener campañas
    const campaniasQuery = `
      SELECT 
        CampañaID as id,
        NombreCampaña as nombre
      FROM PRI.Campanias 
      ORDER BY NombreCampaña
    `;
    const campaniasResult = await executeQuery(campaniasQuery);

    // Obtener jornadas
    const jornadasQuery = `
      SELECT 
        JornadaID as id,
        NombreJornada as nombre
      FROM PRI.Jornada 
      ORDER BY NombreJornada
    `;
    const jornadasResult = await executeQuery(jornadasQuery);

    // Obtener modalidades
    const modalidadesQuery = `
      SELECT 
        ModalidadID as id,
        NombreModalidad as nombre
      FROM PRI.ModalidadesTrabajo 
      ORDER BY NombreModalidad
    `;
    const modalidadesResult = await executeQuery(modalidadesQuery);

    res.json({
      success: true,
      message: 'Catálogos obtenidos exitosamente',
      catalogos: {
        cargos: cargosResult.recordset,
        campanias: campaniasResult.recordset,
        jornadas: jornadasResult.recordset,
        modalidades: modalidadesResult.recordset
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo catálogos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
