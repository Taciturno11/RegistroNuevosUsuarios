const jwt = require('jsonwebtoken');
const { pool, sql } = require('../db');

// DNIs autorizados
const DNIS_AUTORIZADOS = ['72548769', '73766815', '71936801', '44991089', '72880558'];

// Login de usuario
exports.login = async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  // Verificar que el DNI esté autorizado
  if (!DNIS_AUTORIZADOS.includes(usuario)) {
    return res.status(401).json({ error: 'Usuario no autorizado' });
  }

  // Verificar que usuario y contraseña sean iguales (ambos son el DNI)
  if (usuario !== contrasena) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  try {
    const conn = await pool;
    
    // Buscar usuario en la base de datos
    const result = await conn.request()
      .input('dni', sql.VarChar(12), usuario)
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID
        FROM PRI.Empleados 
        WHERE DNI = @dni AND FechaCese IS NULL
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
    }

    const user = result.recordset[0];

    // Determinar rol basado en CargoID
    let rol = 'usuario';
    if (user.CargoID === 8) rol = 'admin';
    else if (user.CargoID === 2) rol = 'supervisor';
    else if (user.CargoID === 5) rol = 'coordinador';

    // Generar token JWT
    const token = jwt.sign(
      { 
        dni: user.DNI, 
        nombre: user.Nombres, 
        rol,
        cargoID: user.CargoID 
      },
      process.env.JWT_SECRET || 'clave_secreta_simple_2024',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      dni: user.DNI,
      nombres: user.Nombres,
      apellidoPaterno: user.ApellidoPaterno,
      apellidoMaterno: user.ApellidoMaterno,
      cargoID: user.CargoID,
      rol
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Middleware de autenticación
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_simple_2024');
    req.user = payload; // { dni, nombre, rol, cargoID }
    next();
  } catch (error) {
    // No loguear errores de token expirado para reducir ruido en consola
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    } else {
      console.error('Error verificando token:', error);
      return res.status(401).json({ error: 'Error de autenticación' });
    }
  }
}; 