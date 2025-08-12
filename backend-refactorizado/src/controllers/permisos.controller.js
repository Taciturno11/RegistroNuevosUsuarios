const { executeQuery, sql } = require('../config/database');

// Crear permiso especial para un empleado
exports.crearPermiso = async (req, res) => {
  try {
    const { dniEmpleado, vista, comentario } = req.body;
    const dniResponsable = req.user.DNI;

    // Debug: Log del usuario que está intentando crear el permiso
    console.log('🔍 Usuario intentando crear permiso:', {
      DNI: req.user.DNI,
      CargoID: req.user.CargoID,
      role: req.user.role,
      esCreador: req.user.DNI === '73766815',
      esAnalista: req.user.CargoID === 4
    });

    // Validar que solo el creador o analistas puedan crear permisos
    if (req.user.DNI !== '73766815' && req.user.CargoID !== 4) {
      console.log('❌ Usuario no autorizado para crear permisos');
      return res.status(403).json({
        success: false,
        message: 'Solo el creador o analistas pueden crear permisos especiales'
      });
    }

    // Verificar que el empleado existe
    const empleadoQuery = `
      SELECT DNI, Nombres, ApellidoPaterno 
      FROM PRI.Empleados 
      WHERE DNI = @dniEmpleado
    `;
    const empleadoResult = await executeQuery(empleadoQuery, [
      { name: 'dniEmpleado', type: sql.VarChar, value: dniEmpleado }
    ]);

    if (empleadoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar si ya tiene el permiso activo
    const checkQuery = `
      SELECT ID FROM PermisosEspeciales 
      WHERE DNIEmpleado = @dniEmpleado 
        AND VistaHabilitada = @vista 
        AND Activo = 1
    `;
    const checkResult = await executeQuery(checkQuery, [
      { name: 'dniEmpleado', type: sql.VarChar, value: dniEmpleado },
      { name: 'vista', type: sql.VarChar, value: vista }
    ]);

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El empleado ya tiene este permiso habilitado'
      });
    }

    // Insertar nuevo permiso
    const insertQuery = `
      INSERT INTO PermisosEspeciales (DNIEmpleado, VistaHabilitada, DNIResponsable)
      VALUES (@dniEmpleado, @vista, @dniResponsable)
    `;
    await executeQuery(insertQuery, [
      { name: 'dniEmpleado', type: sql.VarChar, value: dniEmpleado },
      { name: 'vista', type: sql.VarChar, value: vista },
      { name: 'dniResponsable', type: sql.VarChar, value: dniResponsable }
    ]);

    const empleado = empleadoResult.recordset[0];
    res.json({
      success: true,
      message: `Permiso ${vista} habilitado para ${empleado.Nombres} ${empleado.ApellidoPaterno}`,
      data: {
        empleado: `${empleado.Nombres} ${empleado.ApellidoPaterno}`,
        vista: vista,
        fecha: new Date()
      }
    });

  } catch (error) {
    console.error('Error creando permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Eliminar permiso especial (desactivar)
exports.eliminarPermiso = async (req, res) => {
  try {
    const { id } = req.params;
    const dniResponsable = req.user.DNI;

    // Validar que solo el creador o analistas puedan eliminar permisos
    if (req.user.DNI !== '73766815' && req.user.CargoID !== 4) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador o analistas pueden eliminar permisos especiales'
      });
    }

    // Desactivar permiso (no eliminar físicamente)
    const updateQuery = `
      UPDATE PermisosEspeciales 
      SET Activo = 0 
      WHERE ID = @id
    `;
    const result = await executeQuery(updateQuery, [
      { name: 'id', type: sql.Int, value: id }
    ]);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Permiso deshabilitado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Listar permisos especiales de un empleado
exports.listarPermisosEmpleado = async (req, res) => {
  try {
    const { dni } = req.params;

    // Verificar que solo el creador o analistas puedan ver permisos
    if (req.user.DNI !== '73766815' && req.user.CargoID !== 4) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador o analistas pueden ver permisos especiales'
      });
    }

    // Obtener permisos activos del empleado
    const permisosQuery = `
      SELECT 
        p.ID,
        p.VistaHabilitada,
        p.FechaHabilitacion,
        p.DNIResponsable,
        e.Nombres + ' ' + e.ApellidoPaterno as Responsable
      FROM PermisosEspeciales p
      LEFT JOIN PRI.Empleados e ON p.DNIResponsable = e.DNI
      WHERE p.DNIEmpleado = @dni AND p.Activo = 1
      ORDER BY p.FechaHabilitacion DESC
    `;
    const permisosResult = await executeQuery(permisosQuery, [
      { name: 'dni', type: sql.VarChar, value: dni }
    ]);

    res.json({
      success: true,
      data: permisosResult.recordset
    });

  } catch (error) {
    console.error('Error listando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};
