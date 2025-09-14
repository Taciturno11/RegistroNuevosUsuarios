const { executeQuery, sql } = require('../config/database');
const { formatearFechaLocal } = require('../utils/dateUtils');

// Obtener todos los empleados con información completa
exports.getAllEmpleados = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', estado = '', cargo = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // Filtro de búsqueda
    if (search) {
      whereClause += ` AND (e.DNI LIKE @search OR e.Nombres LIKE @search OR e.ApellidoPaterno LIKE @search OR e.ApellidoMaterno LIKE @search)`;
      params.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
    }

    // Filtro por estado
    if (estado) {
      whereClause += ` AND e.EstadoEmpleado = @estado`;
      params.push({ name: 'estado', type: sql.VarChar, value: estado });
    }

    // Filtro por cargo
    if (cargo) {
      whereClause += ` AND e.CargoID = @cargo`;
      params.push({ name: 'cargo', type: sql.Int, value: parseInt(cargo) });
    }

    // Consulta principal
    const query = `
      SELECT 
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.FechaContratacion,
        e.FechaCese,
        e.EstadoEmpleado,
        e.JornadaID,
        e.CampañaID,
        e.CargoID,
        e.ModalidadID,
        e.SupervisorDNI,
        e.CoordinadorDNI,
        e.JefeDNI,
        e.GrupoHorarioID,
        c.NombreCargo,
        j.NombreJornada,
        camp.NombreCampaña,
        m.NombreModalidad,
        gh.NombreGrupo as NombreGrupoHorario
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      LEFT JOIN dbo.GruposDeHorario gh ON e.GrupoHorarioID = gh.GrupoID
      ${whereClause}
      ORDER BY e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    // Agregar parámetros de paginación
    params.push(
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: parseInt(limit) }
    );

    const result = await executeQuery(query, params);

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, params.slice(0, -2)); // Excluir parámetros de paginación
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Empleados obtenidos exitosamente',
      data: {
        empleados: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener empleado por DNI
exports.getEmpleadoByDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    const query = `
      SELECT 
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.FechaContratacion,
        e.FechaCese,
        e.EstadoEmpleado,
        e.JornadaID,
        e.CampañaID,
        e.CargoID,
        e.ModalidadID,
        e.SupervisorDNI,
        e.CoordinadorDNI,
        e.JefeDNI,
        e.GrupoHorarioID,
        c.NombreCargo,
        j.NombreJornada,
        camp.NombreCampaña,
        m.NombreModalidad,
        gh.NombreGrupo as NombreGrupoHorario,
        ISNULL(sb.MontoMensual, 0) as SueldoBase
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      LEFT JOIN dbo.GruposDeHorario gh ON e.GrupoHorarioID = gh.GrupoID
      LEFT JOIN PRI.SueldoBase sb ON e.DNI = sb.EmpleadoDNI
      WHERE e.DNI = @DNI
    `;

    const result = await executeQuery(query, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Las fechas se envían tal como vienen de la base de datos
    // El frontend las maneja correctamente
    const empleado = result.recordset[0];

    res.json({
      success: true,
      message: 'Empleado obtenido exitosamente',
      data: empleado
    });

  } catch (error) {
    console.error('❌ Error obteniendo empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Crear nuevo empleado
exports.createEmpleado = async (req, res) => {
  try {
    const {
      dni,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaContratacion,
      jornadaID,
      campañaID,
      cargoID,
      modalidadID,
      supervisorDNI,
      coordinadorDNI,
      jefeDNI,
      grupoHorarioID
    } = req.body;

    // Validar campos requeridos
    if (!dni || !nombres || !apellidoPaterno) {
      return res.status(400).json({
        success: false,
        message: 'DNI, nombres y apellido paterno son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verificar si el DNI ya existe
    const existingQuery = 'SELECT DNI FROM PRI.Empleados WHERE DNI = @DNI';
    const existingResult = await executeQuery(existingQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (existingResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un empleado con ese DNI',
        error: 'DUPLICATE_DNI'
      });
    }

    // Insertar nuevo empleado
    const insertQuery = `
      INSERT INTO PRI.Empleados (
        DNI, Nombres, ApellidoPaterno, ApellidoMaterno,
        FechaContratacion, EstadoEmpleado, JornadaID, CampañaID,
        CargoID, ModalidadID, SupervisorDNI, CoordinadorDNI,
        JefeDNI, GrupoHorarioID
      ) VALUES (
        @DNI, @Nombres, @ApellidoPaterno, @ApellidoMaterno,
        @FechaContratacion, 'Activo', @JornadaID, @CampañaID,
        @CargoID, @ModalidadID, @SupervisorDNI, @CoordinadorDNI,
        @JefeDNI, @GrupoHorarioID
      )
    `;

    const params = [
      { name: 'DNI', type: sql.VarChar, value: dni },
      { name: 'Nombres', type: sql.VarChar, value: nombres },
      { name: 'ApellidoPaterno', type: sql.VarChar, value: apellidoPaterno },
      { name: 'ApellidoMaterno', type: sql.VarChar, value: apellidoMaterno || null },
      { name: 'FechaContratacion', type: sql.Date, value: fechaContratacion || new Date() },
      { name: 'JornadaID', type: sql.Int, value: jornadaID || 1 }, // Valor por defecto: 1
      { name: 'CampañaID', type: sql.Int, value: campañaID || 1 }, // Valor por defecto: 1
      { name: 'CargoID', type: sql.Int, value: cargoID || 1 }, // Valor por defecto: 1
      { name: 'ModalidadID', type: sql.Int, value: modalidadID || 1 }, // Valor por defecto: 1
      { name: 'SupervisorDNI', type: sql.VarChar, value: supervisorDNI || null },
      { name: 'CoordinadorDNI', type: sql.VarChar, value: coordinadorDNI || null },
      { name: 'JefeDNI', type: sql.VarChar, value: jefeDNI || null },
      { name: 'GrupoHorarioID', type: sql.Int, value: grupoHorarioID || 1 } // Valor por defecto: 1
    ];

    await executeQuery(insertQuery, params);

    console.log(`✅ Empleado creado exitosamente: ${dni} - ${nombres} ${apellidoPaterno}`);

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: { dni, nombres, apellidoPaterno, apellidoMaterno }
    });

  } catch (error) {
    console.error('❌ Error creando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Actualizar empleado
exports.updateEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;
    const updateData = req.body;

    // Verificar si el empleado existe
    const existingQuery = 'SELECT DNI FROM PRI.Empleados WHERE DNI = @DNI';
    const existingResult = await executeQuery(existingQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (existingResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Construir query de actualización dinámicamente
    const allowedFields = [
      'Nombres', 'ApellidoPaterno', 'ApellidoMaterno', 'FechaContratacion',
      'JornadaID', 'CampañaID', 'CargoID', 'ModalidadID', 'SupervisorDNI',
      'CoordinadorDNI', 'JefeDNI', 'GrupoHorarioID'
    ];

    const updateFields = [];
    const params = [{ name: 'DNI', type: sql.VarChar, value: dni }];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = @${field}`);
        params.push({ name: field, type: getFieldType(field), value: updateData[field] });
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
        error: 'NO_FIELDS_TO_UPDATE'
      });
    }

    const updateQuery = `
      UPDATE PRI.Empleados 
      SET ${updateFields.join(', ')}
      WHERE DNI = @DNI
    `;

    await executeQuery(updateQuery, params);

    console.log(`✅ Empleado actualizado exitosamente: ${dni}`);

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: { dni, updatedFields: updateFields }
    });

  } catch (error) {
    console.error('❌ Error actualizando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Eliminar empleado (cambiar estado a Inactivo)
exports.deleteEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;

    // Verificar si el empleado existe
    const existingQuery = 'SELECT DNI, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI';
    const existingResult = await executeQuery(existingQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    if (existingResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    const empleado = existingResult.recordset[0];

    if (empleado.EstadoEmpleado === 'Inactivo') {
      return res.status(400).json({
        success: false,
        message: 'El empleado ya está inactivo',
        error: 'EMPLOYEE_ALREADY_INACTIVE'
      });
    }

    // Cambiar estado a Inactivo
    const updateQuery = `
      UPDATE PRI.Empleados 
      SET EstadoEmpleado = 'Inactivo', FechaCese = GETDATE()
      WHERE DNI = @DNI
    `;

    await executeQuery(updateQuery, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);

    console.log(`✅ Empleado desactivado exitosamente: ${dni}`);

    res.json({
      success: true,
      message: 'Empleado desactivado exitosamente',
      data: { dni, estado: 'Inactivo' }
    });

  } catch (error) {
    console.error('❌ Error desactivando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener empleados por supervisor
exports.getEmpleadosBySupervisor = async (req, res) => {
  try {
    const { supervisorDNI } = req.params;

    const query = `
      SELECT 
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.EstadoEmpleado,
        c.NombreCargo,
        camp.NombreCampaña
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      WHERE e.SupervisorDNI = @SupervisorDNI AND e.EstadoEmpleado = 'Activo'
      ORDER BY e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
    `;

    const result = await executeQuery(query, [
      { name: 'SupervisorDNI', type: sql.VarChar, value: supervisorDNI }
    ]);

    res.json({
      success: true,
      message: 'Empleados del supervisor obtenidos exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error obteniendo empleados del supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener estadísticas de empleados
exports.getEmpleadosStats = async (req, res) => {
  try {
    // Consulta para contar empleados por estado
    const statsQuery = `
      SELECT 
        EstadoEmpleado,
        COUNT(*) as cantidad
      FROM PRI.Empleados 
      GROUP BY EstadoEmpleado
    `;

    // Consulta para contar ceses del mes actual
    const cesesMesActualQuery = `
      SELECT COUNT(*) as cesesMesActual
      FROM PRI.Empleados 
      WHERE EstadoEmpleado = 'Cese'
        AND MONTH(FechaCese) = MONTH(GETDATE())
        AND YEAR(FechaCese) = YEAR(GETDATE())
    `;

    // Consulta de debug para ver qué hay en la base de datos
    const debugQuery = `
      SELECT EstadoEmpleado, FechaCese, COUNT(*) as cantidad
      FROM PRI.Empleados 
      WHERE EstadoEmpleado = 'Cese'
      GROUP BY EstadoEmpleado, FechaCese
      ORDER BY FechaCese DESC
    `;

    const [statsResult, cesesResult, debugResult] = await Promise.all([
      executeQuery(statsQuery),
      executeQuery(cesesMesActualQuery),
      executeQuery(debugQuery)
    ]);
    
    // Procesar resultados
    let empleadosActivos = 0;
    let empleadosCesados = 0;
    let totalEmpleados = 0;
    let cesesMesActual = 0;

    statsResult.recordset.forEach(row => {
      if (row.EstadoEmpleado === 'Activo') {
        empleadosActivos = row.cantidad;
      } else if (row.EstadoEmpleado === 'Cese') {
        empleadosCesados = row.cantidad;
      }
      totalEmpleados += row.cantidad;
    });

    // Obtener ceses del mes actual
    if (cesesResult.recordset.length > 0) {
      cesesMesActual = cesesResult.recordset[0].cesesMesActual;
    }

    // Log de debug
    console.log('🔍 Debug - Consulta de ceses del mes actual:', cesesResult.recordset);
    console.log('🔍 Debug - Todos los ceses en la base de datos:', debugResult.recordset);
    console.log('🔍 Debug - Mes actual:', new Date().getMonth() + 1, 'Año actual:', new Date().getFullYear());

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      stats: {
        empleadosActivos,
        empleadosCesados,
        totalEmpleados,
        cesesMesActual
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar empleados por término de búsqueda (para sugerencias)
exports.searchEmpleados = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda debe tener al menos 2 caracteres',
        error: 'INVALID_SEARCH_TERM'
      });
    }

    const searchTerm = `%${search.trim()}%`;

    const query = `
      SELECT TOP 10
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.EstadoEmpleado
      FROM PRI.Empleados e
      WHERE (e.DNI LIKE @search 
             OR e.Nombres LIKE @search 
             OR e.ApellidoPaterno LIKE @search 
             OR e.ApellidoMaterno LIKE @search)
      ORDER BY e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
    `;

    const result = await executeQuery(query, [
      { name: 'search', type: sql.VarChar, value: searchTerm }
    ]);

    res.json({
      success: true,
      message: 'Búsqueda realizada exitosamente',
      empleados: result.recordset
    });

  } catch (error) {
    console.error('❌ Error buscando empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Función auxiliar para obtener el tipo de dato SQL Server
function getFieldType(fieldName) {
  const typeMap = {
    'Nombres': sql.VarChar,
    'ApellidoPaterno': sql.VarChar,
    'ApellidoMaterno': sql.VarChar,
    'FechaContratacion': sql.Date,
    'JornadaID': sql.Int,
    'CampañaID': sql.Int,
    'CargoID': sql.Int,
    'ModalidadID': sql.Int,
    'SupervisorDNI': sql.VarChar,
    'CoordinadorDNI': sql.VarChar,
    'JefeDNI': sql.VarChar,
    'GrupoHorarioID': sql.Int
  };

  return typeMap[fieldName] || sql.VarChar;
}

// Actualizar rol de empleado (solo para admin - DEPRECATED, usar /api/acceso)
exports.actualizarRolEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;
    const { role } = req.body;
    const { user: currentUser } = req;

    // Verificar que solo admin pueda actualizar roles
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden actualizar roles',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // DEPRECATED: Esta función ya no se usa, usar /api/acceso/empleados/:dni/rol
    return res.status(410).json({
      success: false,
      message: 'Endpoint deprecado. Usar /api/acceso/empleados/:dni/rol',
      error: 'DEPRECATED_ENDPOINT'
    });

    // Obtener rol anterior del empleado
    const empleadoActualQuery = `
      SELECT e.CargoID, c.NombreCargo
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      WHERE e.DNI = @dni
    `;

    const empleadoActualResult = await executeQuery(empleadoActualQuery, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);

    if (empleadoActualResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    const empleadoActual = empleadoActualResult.recordset[0];
    const rolAnterior = empleadoActual.NombreCargo || 'Sin asignar';

    // Mapear rol a CargoID (sistema correcto basado en PRI.Cargos)
    const roleToCargoID = {
      'agente': 1,        // Agente
      'coordinador': 2,   // Coordinador
      'back office': 3,   // Back Office
      'analista': 4,      // Analista
      'supervisor': 5,    // Supervisor
      'monitor': 6,       // Monitor
      'capacitador': 7,   // Capacitador
      'jefe': 8,          // Jefe
      'controller': 9,    // Controller
      'creador': 9        // Controller (para el creador)
    };

    const cargoID = roleToCargoID[role];

    // Actualizar CargoID en la base de datos
    const updateQuery = `
      UPDATE PRI.Empleados 
      SET CargoID = @cargoID
      WHERE DNI = @dni
    `;

    const result = await executeQuery(updateQuery, [
      { name: 'cargoID', type: sql.Int, value: cargoID },
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado',
        error: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Crear registro en el historial de cambios de roles
    const historialQuery = `
      INSERT INTO PRI.HistorialCambiosRoles (
        DNIEmpleado, 
        RolAnterior, 
        RolNuevo, 
        FechaCambio, 
        DNIResponsable, 
        Comentario
      ) VALUES (
        @dni, 
        @rolAnterior, 
        @rolNuevo, 
        GETDATE(), 
        @dniResponsable, 
        @comentario
      )
    `;

    try {
      await executeQuery(historialQuery, [
        { name: 'dni', type: sql.VarChar, value: dni },
        { name: 'rolAnterior', type: sql.VarChar, value: rolAnterior },
        { name: 'rolNuevo', type: sql.VarChar, value: role },
        { name: 'dniResponsable', type: sql.VarChar, value: currentUser.dni },
        { name: 'comentario', type: sql.VarChar, value: `Cambio de rol realizado por ${currentUser.nombres} ${currentUser.apellidoPaterno}` }
      ]);
    } catch (historialError) {
      console.warn('⚠️ No se pudo crear el historial (tabla puede no existir):', historialError);
      // Continuar aunque no se pueda crear el historial
    }

    // Obtener información actualizada del empleado
    const empleadoQuery = `
      SELECT 
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.CargoID,
        c.NombreCargo
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      WHERE e.DNI = @dni
    `;

    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);

    const empleado = empleadoResult.recordset[0];

    res.json({
      success: true,
      message: `Rol de empleado actualizado exitosamente de "${rolAnterior}" a "${role}"`,
      data: {
        empleado,
        role,
        cargoID,
        rolAnterior,
        rolNuevo: role
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando rol de empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener historial de cambios de roles (DEPRECATED)
exports.obtenerHistorialRoles = async (req, res) => {
  try {
    const { user: currentUser } = req;

    // Verificar que solo admin pueda ver el historial
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden ver el historial de roles',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Intentar obtener el historial de la tabla PRI.HistorialCambiosRoles
    let historialQuery = `
      SELECT 
        h.DNIEmpleado,
        h.RolAnterior,
        h.RolNuevo,
        h.FechaCambio,
        h.DNIResponsable,
        h.Comentario,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno
      FROM PRI.HistorialCambiosRoles h
      LEFT JOIN PRI.Empleados e ON h.DNIEmpleado = e.DNI
      ORDER BY h.FechaCambio DESC
    `;

    try {
      const historialResult = await executeQuery(historialQuery);
      
      res.json({
        success: true,
        message: 'Historial de cambios de roles obtenido exitosamente',
        data: historialResult.recordset
      });
    } catch (historialError) {
      // Si la tabla no existe, devolver array vacío
      console.warn('⚠️ Tabla de historial no encontrada, devolviendo array vacío');
      res.json({
        success: true,
        message: 'No hay historial de cambios de roles disponible',
        data: []
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo historial de roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener todos los empleados con roles REALES desde ge.UsuarioRol (no CargoID)
exports.getAllEmpleadosConRoles = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.DNI,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        e.FechaContratacion,
        e.FechaCese,
        e.EstadoEmpleado,
        e.JornadaID,
        e.CampañaID,
        e.CargoID,
        e.ModalidadID,
        e.SupervisorDNI,
        e.CoordinadorDNI,
        e.JefeDNI,
        e.GrupoHorarioID,
        c.NombreCargo,
        j.NombreJornada,
        camp.NombreCampaña,
        m.NombreModalidad,
        gh.NombreGrupo as NombreGrupoHorario,
        r.NombreRol as RolAsignado
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      LEFT JOIN dbo.GruposDeHorario gh ON e.GrupoHorarioID = gh.GrupoID
      LEFT JOIN ge.UsuarioRol ur ON ur.DNI = e.DNI
      LEFT JOIN ge.Roles r ON r.RoleID = ur.RoleID AND r.Activo = 1
      ORDER BY e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
    `;

    const result = await executeQuery(query);

    // Usar roles REALES de ge.UsuarioRol (no mapear por CargoID)
    const empleadosConRoles = result.recordset.map(emp => {
      let role = emp.RolAsignado || 'agente'; // Rol desde ge.UsuarioRol o 'agente' por defecto
      
      // Admin especial (fallback)
      if (emp.DNI === '73766815' && !emp.RolAsignado) {
        role = 'admin';
      }
      
      return {
        ...emp,
        role: role
      };
    });

    res.json({
      success: true,
      message: 'Empleados con roles reales obtenidos exitosamente',
      data: empleadosConRoles
    });

  } catch (error) {
    console.error('❌ Error obteniendo empleados con roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
// LOOKUP PARA AUTOCOMPLETADO
// ========================================

// Lookup para autocompletar DNI (acepta varios cargos: ?cargo=2,8)
exports.lookupEmpleados = async (req, res) => {
  try {
    const { cargo, search } = req.query;
    
    if (!cargo) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro cargo es requerido',
        error: 'MISSING_CARGO_PARAM'
      });
    }

    console.log(`🔍 Lookup empleados - Cargo: ${cargo}, Búsqueda: ${search || 'vacía'}`);

    // Construir la consulta base
    let query = `
      SELECT 
        e.DNI,
        CONCAT(e.Nombres, ' ', e.ApellidoPaterno, ' ', ISNULL(e.ApellidoMaterno, '')) AS NOMBRECOMPLETO,
        e.Nombres,
        e.ApellidoPaterno,
        e.ApellidoMaterno
      FROM PRI.Empleados e
      WHERE e.EstadoEmpleado = 'Activo'
    `;

    const params = [];

    // Filtrar por cargo(s)
    if (cargo.includes(',')) {
      // Múltiples cargos separados por coma
      const cargos = cargo.split(',').map(c => c.trim());
      query += ` AND e.CargoID IN (${cargos.map((_, i) => `@Cargo${i}`).join(',')})`;
      cargos.forEach((c, i) => {
        params.push({ name: `Cargo${i}`, type: sql.Int, value: parseInt(c) });
      });
    } else {
      // Un solo cargo
      query += ` AND e.CargoID = @CargoID`;
      params.push({ name: 'CargoID', type: sql.Int, value: parseInt(cargo) });
    }

    // Filtrar por término de búsqueda si se proporciona
    if (search && search.trim()) {
      query += ` AND (e.DNI LIKE @Search OR e.Nombres LIKE @Search OR e.ApellidoPaterno LIKE @Search)`;
      params.push({ name: 'Search', type: sql.VarChar, value: `%${search.trim()}%` });
    }

    query += ` ORDER BY e.Nombres, e.ApellidoPaterno`;

    const result = await executeQuery(query, params);

    console.log(`✅ Lookup completado: ${result.recordset.length} empleados encontrados`);

    res.json({
      success: true,
      message: 'Lookup completado exitosamente',
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error en lookup de empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// ========================================
