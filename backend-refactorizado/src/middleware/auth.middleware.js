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
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
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

      // Verificar que el empleado esté activo (aceptar variantes de mayúsculas)
      const estadoEmpleado = String(user.EstadoEmpleado || '').trim().toLowerCase();
      if (estadoEmpleado !== 'activo') {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo',
          error: 'USER_INACTIVE'
        });
      }

      // Usar exclusivamente el rol emitido en el JWT (admin/agente)
      const role = payload.role || (user.DNI === '73766815' ? 'admin' : 'agente');

      // Agregar información del usuario al request
      req.user = {
        dni: user.DNI,
        nombres: user.Nombres,
        apellidoPaterno: user.ApellidoPaterno,
        CargoID: user.CargoID,
        cargoID: user.CargoID,
        role: role,
        vistas: payload.vistas || [],
        estadoEmpleado: user.EstadoEmpleado,
        iat: payload.iat,
        exp: payload.exp
      };

      // Log de autenticación exitosa
      console.log(`🔐 Usuario autenticado: ${user.DNI} - ${user.Nombres} ${user.ApellidoPaterno}`);
      console.log(`🔐 req.user.dni: ${req.user.dni}`);
      console.log(`🔐 req.user.role: ${req.user.role}`);
      console.log(`🔐 req.user.vistas:`, req.user.vistas);
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
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar usuario en BD
      const userResult = await executeQuery(
        'SELECT DNI, Nombres, ApellidoPaterno, CargoID, EstadoEmpleado FROM PRI.Empleados WHERE DNI = @DNI',
        [{ name: 'DNI', type: sql.VarChar, value: payload.dni }]
      );

      if (userResult.recordset.length > 0) {
        const user = userResult.recordset[0];
        
        // Usar rol del JWT (ya no calcular por CargoID)
        let role = payload.role || (user.DNI === '73766815' ? 'admin' : 'agente');
        
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

// Middleware para verificar vistas específicas
const requireVista = (requiredVista) => {
  return (req, res, next) => {
    console.log('🔐 requireVista ejecutándose para vista:', requiredVista, 'Usuario:', req.user?.dni, 'Role:', req.user?.role, 'Vistas:', req.user?.vistas);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Admin siempre tiene acceso
    if (req.user.role === 'admin') {
      console.log('✅ requireVista: Admin acceso permitido');
      return next();
    }

    // Verificar si tiene la vista específica
    if (req.user.vistas && req.user.vistas.includes(requiredVista)) {
      console.log('✅ requireVista: Acceso permitido por vista');
      return next();
    }

    console.log('❌ requireVista: Acceso denegado');
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado - Vista no autorizada',
      error: 'INSUFFICIENT_PERMISSIONS',
      requiredVista: requiredVista,
      userRole: req.user.role,
      userVistas: req.user.vistas
    });
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireVista
};
