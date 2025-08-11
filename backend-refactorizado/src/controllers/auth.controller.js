const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('../config/database');

// Función para generar token JWT
const generateToken = (userData) => {
  const payload = {
    dni: userData.DNI,
    nombres: userData.Nombres,
    apellidoPaterno: userData.ApellidoPaterno,
    cargoID: userData.CargoID,
    iat: Date.now(),
    exp: Date.now() + (parseInt(process.env.JWT_EXPIRES_IN || '8h') * 60 * 60 * 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta_simple_2024');
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

    // Generar token JWT
    const token = generateToken(user);

    // Preparar respuesta del usuario (sin información sensible)
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

    console.log(`✅ Login exitoso para: ${user.DNI} - ${user.Nombres} ${user.ApellidoPaterno}`);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
        token: token,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
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
          expiresIn: process.env.JWT_EXPIRES_IN || '8h'
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
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
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
