const { executeQuery, sql } = require('../config/database');

// GET /api/acceso/catalogo
// Devuelve listado de roles y vistas
exports.getCatalogo = async (req, res) => {
  try {
    // Asegurar que las vistas estén creadas
    console.log('🔄 getCatalogo: Creando vistas iniciales...');
    await crearVistasIniciales();
    
    const [rolesRes, vistasRes] = await Promise.all([
      executeQuery(`SELECT RoleID, NombreRol, Activo FROM ge.Roles ORDER BY NombreRol`),
      executeQuery(`SELECT VistaID, NombreVista, Activo FROM ge.Vistas ORDER BY NombreVista`)
    ]);

    res.json({
      success: true,
      data: {
        roles: rolesRes.recordset,
        vistas: vistasRes.recordset
      }
    });
  } catch (error) {
    console.error('❌ getCatalogo error:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo catálogo' });
  }
};

// Función auxiliar para crear vistas organizadas
const crearVistasIniciales = async () => {
  try {
    const vistas = [
      // Dashboard
      'Dashboard',
      // Gestión de Empleados
      'Registrar Empleado',
      'Actualizar Empleado', 
      'Cese de Empleado',
      'Justificaciones',
      'OJT / CIC',
      'Asignación Excepciones',
      'Bonos',
      'Ejecutar SP',
      // Reportes individuales
      'Reporte de Asistencias',
      'Reporte de Tardanzas',
      // Nómina
      'Pagos de Nómina',
      // Capacitaciones
      'Capacitaciones',
      // Seguridad
      'Control Maestro'
    ];

    console.log('🔍 Creando vistas:', vistas);

    for (const vista of vistas) {
      console.log(`🔍 Verificando/creando vista: ${vista}`);
      
      // Verificar si existe
      const exists = await executeQuery(
        `SELECT 1 FROM ge.Vistas WHERE NombreVista = @NombreVista`,
        [{ name: 'NombreVista', type: sql.VarChar, value: vista }]
      );
      
      if (exists.recordset.length === 0) {
        console.log(`➕ Creando vista nueva: ${vista}`);
        await executeQuery(
          `INSERT INTO ge.Vistas (NombreVista, Activo) VALUES (@NombreVista, 1)`,
          [{ name: 'NombreVista', type: sql.VarChar, value: vista }]
        );
        console.log(`✅ Vista creada: ${vista}`);
      } else {
        console.log(`✅ Vista ya existe: ${vista}`);
      }
    }
    
    // Verificar qué vistas se crearon
    const verificacion = await executeQuery(`SELECT NombreVista FROM ge.Vistas ORDER BY NombreVista`);
    console.log('🔍 Vistas en BD:', verificacion.recordset.map(v => v.NombreVista));
  } catch (error) {
    console.warn('⚠️ Error creando vistas iniciales:', error);
  }
};

// POST /api/acceso/roles  body: { nombreRol }
exports.createRole = async (req, res) => {
  try {
    const { nombreRol } = req.body;
    if (!nombreRol) {
      return res.status(400).json({ success: false, message: 'nombreRol es requerido' });
    }

    // Verificar existencia
    const exists = await executeQuery(`SELECT 1 FROM ge.Roles WHERE NombreRol = @NombreRol`, [
      { name: 'NombreRol', type: sql.VarChar, value: nombreRol }
    ]);
    if (exists.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'El rol ya existe' });
    }

    await executeQuery(`INSERT INTO ge.Roles (NombreRol, Activo) VALUES (@NombreRol, 1)`, [
      { name: 'NombreRol', type: sql.VarChar, value: nombreRol }
    ]);

    res.status(201).json({ success: true, message: 'Rol creado correctamente' });
  } catch (error) {
    console.error('❌ createRole error:', error);
    res.status(500).json({ success: false, message: 'Error creando rol' });
  }
};

// GET /api/acceso/roles/:nombreRol/vistas
// Devuelve las vistas asignadas a un rol (por nombreRol)
exports.getRoleVistas = async (req, res) => {
  try {
    const { nombreRol } = req.params;

    const result = await executeQuery(
      `SELECT v.NombreVista
       FROM ge.RolVista rv
       JOIN ge.Roles r ON r.RoleID = rv.RoleID
       JOIN ge.Vistas v ON v.VistaID = rv.VistaID
       WHERE r.NombreRol = @NombreRol`,
      [{ name: 'NombreRol', type: sql.VarChar, value: nombreRol }]
    );

    res.json({ success: true, data: result.recordset.map(r => r.NombreVista) });
  } catch (error) {
    console.error('❌ getRoleVistas error:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo vistas del rol' });
  }
};

// PUT /api/acceso/roles/:nombreRol/vistas  body: { vistas: ['CAPACITACIONES', ...] }
exports.setRoleVistas = async (req, res) => {
  try {
    const { nombreRol } = req.params;
    const { vistas } = req.body;

    if (!Array.isArray(vistas)) {
      return res.status(400).json({ success: false, message: 'vistas debe ser un arreglo' });
    }

    // Obtener RoleID
    const rolRes = await executeQuery(
      `SELECT RoleID FROM ge.Roles WHERE NombreRol = @NombreRol`,
      [{ name: 'NombreRol', type: sql.VarChar, value: nombreRol }]
    );
    if (rolRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    }
    const roleId = rolRes.recordset[0].RoleID;

    // Borrar asignaciones actuales
    await executeQuery(`DELETE FROM ge.RolVista WHERE RoleID = @RoleID`, [
      { name: 'RoleID', type: sql.Int, value: roleId }
    ]);

    if (vistas.length > 0) {
      // Obtener VistaIDs por NombreVista
      const vistaRes = await executeQuery(
        `SELECT VistaID, NombreVista FROM ge.Vistas WHERE NombreVista IN (${vistas.map((_, i) => `@V${i}`).join(',')})`,
        vistas.map((v, i) => ({ name: `V${i}`, type: sql.VarChar, value: v }))
      );

      // Insertar nuevas asignaciones
      for (const row of vistaRes.recordset) {
        await executeQuery(`INSERT INTO ge.RolVista (RoleID, VistaID) VALUES (@RoleID, @VistaID)`, [
          { name: 'RoleID', type: sql.Int, value: roleId },
          { name: 'VistaID', type: sql.Int, value: row.VistaID }
        ]);
      }
    }

    res.json({ success: true, message: 'Vistas del rol actualizadas' });
  } catch (error) {
    console.error('❌ setRoleVistas error:', error);
    res.status(500).json({ success: false, message: 'Error actualizando vistas del rol' });
  }
};

// GET /api/acceso/empleados/:dni
exports.getEmpleadoAcceso = async (req, res) => {
  try {
    const { dni } = req.params;
    const rolRes = await executeQuery(
      `SELECT r.RoleID, r.NombreRol
       FROM ge.UsuarioRol ur
       JOIN ge.Roles r ON r.RoleID = ur.RoleID
       WHERE ur.DNI = @DNI`,
      [{ name: 'DNI', type: sql.VarChar, value: dni }]
    );

    res.json({ success: true, data: rolRes.recordset[0] || null });
  } catch (error) {
    console.error('❌ getEmpleadoAcceso error:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo acceso del empleado' });
  }
};

// PUT /api/acceso/empleados/:dni/rol  body: { nombreRol }
exports.setEmpleadoRol = async (req, res) => {
  try {
    const { dni } = req.params;
    const { nombreRol } = req.body;
    if (!nombreRol) return res.status(400).json({ success: false, message: 'nombreRol requerido' });

    const rolRes = await executeQuery(
      `SELECT RoleID FROM ge.Roles WHERE NombreRol = @NombreRol AND Activo = 1`,
      [{ name: 'NombreRol', type: sql.VarChar, value: nombreRol }]
    );
    if (rolRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    const roleId = rolRes.recordset[0].RoleID;

    // Upsert simple
    const existsRes = await executeQuery(`SELECT DNI FROM ge.UsuarioRol WHERE DNI = @DNI`, [
      { name: 'DNI', type: sql.VarChar, value: dni }
    ]);
    if (existsRes.recordset.length > 0) {
      await executeQuery(`UPDATE ge.UsuarioRol SET RoleID = @RoleID WHERE DNI = @DNI`, [
        { name: 'RoleID', type: sql.Int, value: roleId },
        { name: 'DNI', type: sql.VarChar, value: dni }
      ]);
    } else {
      await executeQuery(`INSERT INTO ge.UsuarioRol (DNI, RoleID) VALUES (@DNI, @RoleID)`, [
        { name: 'DNI', type: sql.VarChar, value: dni },
        { name: 'RoleID', type: sql.Int, value: roleId }
      ]);
    }

    res.json({ success: true, message: 'Rol asignado al empleado' });
  } catch (error) {
    console.error('❌ setEmpleadoRol error:', error);
    res.status(500).json({ success: false, message: 'Error asignando rol al empleado' });
  }
};


