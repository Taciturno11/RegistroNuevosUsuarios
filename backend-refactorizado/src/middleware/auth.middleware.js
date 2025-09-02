const jwt = require('jsonwebtoken');
const { executeQuery, sql } = require('../config/database');

// Middleware de autenticación JWT
const authMiddleware = async (req, res, next) => {
  console.log('🔐 authMiddleware ejecutándose para:', req.method, req.path);
  
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
        error: 'MISSING_TOKEN'
      });
    }

    // Verificar formato del token (Bearer TOKEN)
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
        error: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = tokenParts[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido',
        error: 'EMPTY_TOKEN'
      });
    }

    try {
      // Verificar el token JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_simple_2024');
      
      // Verificar que el usuario existe en la base de datos
      const userResult = await executeQuery(
        'SELECT DNI, Nombres, ApellidoPaterno, CargoID, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI',
        [{ name: 'DNI', type: sql.VarChar, value: payload.dni }]
      );

      if (userResult.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
          error: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.recordset[0];

      // Verificar que el empleado esté activo
      if (user.EstadoEmpleado !== 'Activo') {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo',
          error: 'USER_INACTIVE'
        });
      }

      // Determinar rol basado en CargoID
      let role = 'empleado';
      if (user.CargoID === 1) role = 'agente';
      else if (user.CargoID === 2) role = 'coordinador';
      else if (user.CargoID === 3) role = 'back office';
      else if (user.CargoID === 4) role = 'analista';
      else if (user.CargoID === 5) role = 'supervisor';
      else if (user.CargoID === 6) role = 'monitor';
      else if (user.CargoID === 7) role = 'capacitador';
      else if (user.CargoID === 8) role = 'jefe';
      else if (user.CargoID === 9) role = 'controller';
      
      // El creador siempre tiene acceso especial
      if (user.DNI === '73766815') role = 'creador';
      // La jefa especial tiene acceso a capacitaciones además de reportes
      else if (user.DNI === '76157106') role = 'jefe_capacitaciones';
      // Los demás jefes solo tienen acceso a reportes
      else if (user.CargoID === 8) role = 'jefe_reportes';



      // Agregar información del usuario al request
      req.user = {
        dni: user.DNI,
        nombres: user.Nombres,
        apellidoPaterno: user.ApellidoPaterno,
        CargoID: user.CargoID, // Mantener mayúscula para consistencia
        cargoID: user.CargoID, // También en minúscula para compatibilidad
        role: role, // Agregar el rol
        estadoEmpleado: user.EstadoEmpleado,
        iat: payload.iat,
        exp: payload.exp
      };

      // Log de autenticación exitosa
      console.log(`🔐 Usuario autenticado: ${user.DNI} - ${user.Nombres} ${user.ApellidoPaterno}`);
      console.log(`🔐 req.user.dni: ${req.user.dni}`);
      console.log(`🔐 payload.dni: ${payload.dni}`);

      next();
      
    } catch (jwtError) {
      // Manejar diferentes tipos de errores JWT
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          error: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          error: 'INVALID_TOKEN'
        });
      } else {
        console.error('❌ Error verificando token JWT:', jwtError);
        return res.status(401).json({
          success: false,
          message: 'Error de autenticación',
          error: 'JWT_VERIFICATION_ERROR'
        });
      }
    }

  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Middleware opcional de autenticación (para rutas que pueden funcionar con o sin token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // Si no hay token, continuar sin usuario autenticado
      req.user = null;
      return next();
    }

    // Si hay token, intentar autenticar
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }

    const token = tokenParts[1];
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_simple_2024');
      
      // Verificar usuario en BD
      const userResult = await executeQuery(
        'SELECT DNI, Nombres, ApellidoPaterno, CargoID, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI',
        [{ name: 'DNI', type: sql.VarChar, value: payload.dni }]
      );

      if (userResult.recordset.length > 0) {
        const user = userResult.recordset[0];
        
        // Determinar rol basado en CargoID
        let role = 'empleado';
        if (user.CargoID === 8) role = 'admin';
        else if (user.CargoID === 2) role = 'supervisor';
        else if (user.CargoID === 5) role = 'auditor';
        else if (user.CargoID === 9) role = 'creador';
        else if (user.DNI === '73766815') role = 'creador'; // Asegurar que el creador tenga el rol correcto
        else if (user.DNI === '76157106') role = 'jefe_capacitaciones'; // Asegurar que la jefa especial tenga el rol correcto
        else if (user.CargoID === 8) role = 'jefe_reportes'; // Los demás jefes solo reportes
        
        req.user = {
          dni: user.DNI,
          nombres: user.Nombres,
          apellidoPaterno: user.ApellidoPaterno,
          cargoID: user.CargoID,
          role: role, // Agregar el rol
          estadoEmpleado: user.EstadoEmpleado
        };
      } else {
        req.user = null;
      }

    } catch (jwtError) {
      // Si hay error JWT, continuar sin usuario
      req.user = null;
    }

    next();
    
  } catch (error) {
    console.error('❌ Error en middleware de autenticación opcional:', error);
    req.user = null;
    next();
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log('🔐 requireRole ejecutándose para roles:', allowedRoles, 'Usuario actual:', req.user?.role);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado - Permisos insuficientes',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole
};
