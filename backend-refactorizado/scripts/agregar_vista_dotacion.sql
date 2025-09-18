-- ===============================================
-- SCRIPT PARA AGREGAR VISTA "DOTACIÓN" AL SISTEMA
-- ===============================================

-- 1. Verificar si existe la vista "Dotación"
IF NOT EXISTS (SELECT * FROM ge.Vistas WHERE NombreVista = 'Dotación')
BEGIN
    PRINT '📊 Agregando vista "Dotación" al sistema...'
    
    -- Insertar la vista
    INSERT INTO ge.Vistas (NombreVista, Descripcion, Activo, FechaCreacion)
    VALUES ('Dotación', 'Módulo de gestión de dotación por campaña y jornada', 1, GETDATE())
    
    PRINT '✅ Vista "Dotación" agregada exitosamente'
END
ELSE
BEGIN
    PRINT '✅ La vista "Dotación" ya existe'
END

-- 2. Obtener el ID de la vista "Dotación"
DECLARE @VistaDotacionID INT
SELECT @VistaDotacionID = VistaID FROM ge.Vistas WHERE NombreVista = 'Dotación'

-- 3. Obtener el ID del rol "Admin" (asumiendo que existe)
DECLARE @RolAdminID INT
SELECT @RolAdminID = RoleID FROM ge.Roles WHERE NombreRol = 'admin'

-- 4. Asignar la vista "Dotación" al rol "Admin" si no está asignada
IF @RolAdminID IS NOT NULL AND NOT EXISTS (
    SELECT * FROM ge.RolVista 
    WHERE RoleID = @RolAdminID AND VistaID = @VistaDotacionID
)
BEGIN
    PRINT '🔗 Asignando vista "Dotación" al rol Admin...'
    
    INSERT INTO ge.RolVista (RoleID, VistaID, Activo, FechaCreacion)
    VALUES (@RolAdminID, @VistaDotacionID, 1, GETDATE())
    
    PRINT '✅ Vista "Dotación" asignada al rol Admin exitosamente'
END
ELSE
BEGIN
    PRINT '✅ La vista "Dotación" ya está asignada al rol Admin'
END

-- 5. Verificar que la tabla DotacionMetas existe, si no crearla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DotacionMetas' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '📊 Creando tabla DotacionMetas...'
    
    CREATE TABLE [dbo].[DotacionMetas] (
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [CampañaID] [int] NOT NULL,
        [Meta] [int] NOT NULL,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [FechaModificacion] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_DotacionMetas] PRIMARY KEY CLUSTERED ([ID] ASC),
        CONSTRAINT [IX_DotacionMetas_CampañaID] UNIQUE ([CampañaID])
    )
    
    PRINT '✅ Tabla DotacionMetas creada exitosamente'
END
ELSE
BEGIN
    PRINT '✅ La tabla DotacionMetas ya existe'
END

-- 6. Mostrar resumen de la configuración
PRINT '====================================='
PRINT '📊 RESUMEN DE CONFIGURACIÓN DOTACIÓN'
PRINT '====================================='

SELECT 
    v.NombreVista,
    v.Descripcion,
    v.Activo as VistaActiva,
    r.NombreRol,
    rv.Activo as AsignacionActiva
FROM ge.Vistas v
LEFT JOIN ge.RolVista rv ON v.VistaID = rv.VistaID
LEFT JOIN ge.Roles r ON rv.RoleID = r.RoleID
WHERE v.NombreVista = 'Dotación'

PRINT '====================================='
PRINT '✅ Configuración de Dotación completada'
PRINT '====================================='
