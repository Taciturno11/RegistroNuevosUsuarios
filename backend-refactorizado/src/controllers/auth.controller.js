const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('../config/database');
const { formatearFechaLocal } = require('../utils/dateUtils');

// Función para generar token JWT con rol y vistas
const generateToken = (userData, role, vistas) => {
  const payload = {
    dni: userData.DNI,
    nombres: userData.Nombres,
    apellidoPaterno: userData.ApellidoPaterno,
    cargoID: userData.CargoID,
    role,
    vistas: Array.isArray(vistas) ? vistas : []
  };

  const hours = parseInt(process.env.JWT_EXPIRES_IN || '8', 10);
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${hours}h` });
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { dni, password } = req.body;

    // Validar campos requeridos
    if (!dni || !password) {
      return res.status(400).json({
        success: false,
        message: 'DNI y contraseña son requeridos',
        error: 'MISSING_CREDENTIALS'
      });
    }

    console.log(`🔐 Intento de login para DNI: ${dni}`);

    // Buscar usuario en la base de datos
    const userResult = await executeQuery(
      `SELECT 
        e.DNI, 
        e.Nombres, 
        e.ApellidoPaterno, 
        e.ApellidoMaterno,
        e.EstadoEmpleado,
        e.CargoID,
        e.JornadaID,
        e.CampañaID,
        e.ModalidadID,
        e.SupervisorDNI,
        e.CoordinadorDNI,
        e.JefeDNI,
        e.GrupoHorarioID,
        c.NombreCargo,
        j.NombreJornada,
        camp.NombreCampaña,
        m.NombreModalidad
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      WHERE e.DNI = @DNI`,
      [{ name: 'DNI', type: sql.VarChar, value: dni }]
    );

    if (userResult.recordset.length === 0) {
      console.log(`❌ Usuario no encontrado: ${dni}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.recordset[0];

    // Verificar que el empleado esté activo
    if (user.EstadoEmpleado !== 'Activo') {
      console.log(`❌ Usuario inactivo: ${dni} - Estado: ${user.EstadoEmpleado}`);
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo',
        error: 'USER_INACTIVE',
        estado: user.EstadoEmpleado
      });
    }

    // Verificar contraseña (por ahora asumimos que es el DNI)
    // En un sistema real, aquí verificarías contra un hash
    if (password !== dni) {
      console.log(`❌ Contraseña incorrecta para: ${dni}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Determinar rol desde tablas ge (fallback a admin/agente)
    let role = 'agente';
    try {
      console.log(`🔍 Buscando rol para DNI: ${dni}`);
      const rolResult = await executeQuery(
        `SELECT r.NombreRol
         FROM ge.UsuarioRol ur
         JOIN ge.Roles r ON r.RoleID = ur.RoleID AND r.Activo = 1
         WHERE ur.DNI = @DNI`,
        [{ name: 'DNI', type: sql.VarChar, value: dni }]
      );
      console.log(`🔍 Resultado consulta rol:`, rolResult.recordset);
      if (rolResult.recordset.length > 0) {
        role = rolResult.recordset[0].NombreRol || 'agente';
        console.log(`✅ Rol encontrado: ${role}`);
      } else if (user.DNI === '73766815') {
        role = 'admin';
        console.log(`✅ Rol admin asignado a creador`);
      } else {
        console.log(`⚠️ No se encontró rol para DNI ${dni}, usando 'agente'`);
      }
    } catch (e) {
      console.warn('⚠️ No se pudo obtener rol desde ge.UsuarioRol. Usando fallback.', e.message);
      role = user.DNI === '73766815' ? 'admin' : 'agente';
    }

    // Obtener vistas del rol desde ge.RolVista → ge.Vistas
    let vistas = [];
    try {
      console.log(`🔍 Buscando vistas para rol: ${role}`);
      const vistasResult = await executeQuery(
        `SELECT v.NombreVista
         FROM ge.RolVista rv
         JOIN ge.Roles r ON r.RoleID = rv.RoleID AND r.Activo = 1
         JOIN ge.Vistas v ON v.VistaID = rv.VistaID AND v.Activo = 1
         WHERE r.NombreRol = @NombreRol`,
        [{ name: 'NombreRol', type: sql.VarChar, value: role }]
      );
      console.log(`🔍 Resultado consulta vistas:`, vistasResult.recordset);
      vistas = vistasResult.recordset.map(r => r.NombreVista);
      console.log(`✅ Vistas asignadas:`, vistas);
    } catch (e) {
      console.warn('⚠️ No se pudieron obtener vistas del rol. Continuando sin vistas.', e.message);
      vistas = [];
    }

    // Generar token JWT (con role y vistas)
    const token = generateToken(user, role, vistas);

    // Preparar respuesta del usuario (sin información sensible)
    const userResponse = {
      dni: user.DNI,
      nombres: user.Nombres,
      apellidoPaterno: user.ApellidoPaterno,
      apellidoMaterno: user.ApellidoMaterno,
      cargoID: user.CargoID,
      nombreCargo: user.NombreCargo,
      role: role,
      vistas: vistas,
      jornadaID: user.JornadaID,
      nombreJornada: user.NombreJornada,
      campañaID: user.CampañaID,
      nombreCampaña: user.NombreCampaña,
      modalidadID: user.ModalidadID,
      nombreModalidad: user.NombreModalidad,
      supervisorDNI: user.SupervisorDNI,
      coordinadorDNI: user.CoordinadorDNI,
      jefeDNI: user.JefeDNI,
      grupoHorarioID: user.GrupoHorarioID,
      estadoEmpleado: user.EstadoEmpleado
    };

    console.log(`✅ Login exitoso para: ${user.DNI} - ${user.Nombres} ${user.ApellidoPaterno}`);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
        token: token,
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Verificar token y obtener información del usuario
exports.verifyToken = async (req, res) => {
  try {
    // El middleware de autenticación ya verificó el token
    // y agregó la información del usuario a req.user
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        error: 'INVALID_TOKEN'
      });
    }

    // Obtener información completa del usuario
    const userResult = await executeQuery(
      `SELECT 
        e.DNI, 
        e.Nombres, 
        e.ApellidoPaterno, 
        e.ApellidoMaterno,
        e.EstadoEmpleado,
        e.CargoID,
        e.JornadaID,
        e.CampañaID,
        e.ModalidadID,
        e.SupervisorDNI,
        e.CoordinadorDNI,
        e.JefeDNI,
        e.GrupoHorarioID,
        c.NombreCargo,
        j.NombreJornada,
        camp.NombreCampaña,
        m.NombreModalidad
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      WHERE e.DNI = @DNI`,
             [{ name: 'DNI', type: sql.VarChar, value: req.user.dni }]
    );

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.recordset[0];

    // Preparar respuesta del usuario
    const userResponse = {
      dni: user.DNI,
      nombres: user.Nombres,
      apellidoPaterno: user.ApellidoPaterno,
      apellidoMaterno: user.ApellidoMaterno,
      cargoID: user.CargoID,
      nombreCargo: user.NombreCargo,
      jornadaID: user.JornadaID,
      nombreJornada: user.NombreJornada,
      campañaID: user.CampañaID,
      nombreCampaña: user.NombreCampaña,
      modalidadID: user.ModalidadID,
      nombreModalidad: user.NombreModalidad,
      supervisorDNI: user.SupervisorDNI,
      coordinadorDNI: user.CoordinadorDNI,
      jefeDNI: user.JefeDNI,
      grupoHorarioID: user.GrupoHorarioID,
      estadoEmpleado: user.EstadoEmpleado
    };

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: userResponse,
        tokenInfo: {
          iat: req.user.iat,
          exp: req.user.exp,
          expiresIn: process.env.JWT_EXPIRES_IN
        }
      }
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Logout (opcional - en JWT no es necesario, pero es buena práctica)
exports.logout = async (req, res) => {
  try {
    // En un sistema JWT, el logout se maneja del lado del cliente
    // eliminando el token, pero podemos registrar la acción
    
    if (req.user) {
      console.log(`🔓 Logout exitoso para: ${req.user.dni} - ${req.user.nombres} ${req.user.apellidoPaterno}`);
    }

    res.json({
      success: true,
      message: 'Logout exitoso',
      data: {
        timestamp: new Date().toISOString(),
        note: 'El token JWT debe ser eliminado del lado del cliente'
      }
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Obtener información del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Obtener información completa del usuario
    const userResult = await executeQuery(
      `SELECT 
        e.DNI, 
        e.Nombres, 
        e.ApellidoPaterno, 
        e.ApellidoMaterno,
        e.FechaContratacion,
        e.EstadoEmpleado,
        e.CargoID,
        e.JornadaID,
        e.CampañaID,
        e.ModalidadID,
        e.SupervisorDNI,
        e.CoordinadorDNI,
        e.JefeDNI,
        e.GrupoHorarioID,
        c.NombreCargo,
        j.NombreJornada,
        camp.NombreCampaña,
        m.NombreModalidad
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON e.CargoID = c.CargoID
      LEFT JOIN PRI.Jornada j ON e.JornadaID = j.JornadaID
      LEFT JOIN PRI.Campanias camp ON e.CampañaID = camp.CampañaID
      LEFT JOIN PRI.ModalidadesTrabajo m ON e.ModalidadID = m.ModalidadID
      WHERE e.DNI = @DNI`,
      [{ name: 'DNI', type: sql.VarChar, value: req.user.dni }]
    );

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.recordset[0];

    // Preparar respuesta del usuario
    const userResponse = {
      dni: user.DNI,
      nombres: user.Nombres,
      apellidoPaterno: user.ApellidoPaterno,
      apellidoMaterno: user.ApellidoMaterno,
      fechaContratacion: user.FechaContratacion,
      estadoEmpleado: user.EstadoEmpleado,
      cargoID: user.CargoID,
      nombreCargo: user.NombreCargo,
      jornadaID: user.JornadaID,
      nombreJornada: user.NombreJornada,
      campañaID: user.CampañaID,
      nombreCampaña: user.NombreCampaña,
      modalidadID: user.ModalidadID,
      nombreModalidad: user.NombreModalidad,
      supervisorDNI: user.SupervisorDNI,
      coordinadorDNI: user.CoordinadorDNI,
      jefeDNI: user.JefeDNI,
      grupoHorarioID: user.GrupoHorarioID
    };

    res.json({
      success: true,
      message: 'Información del usuario obtenida exitosamente',
      data: userResponse
    });

  } catch (error) {
    console.error('❌ Error obteniendo información del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Renovar token (opcional)
exports.refreshToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Generar nuevo token
    const newToken = generateToken(req.user);

    res.json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('❌ Error renovando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
